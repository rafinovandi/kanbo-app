#!/usr/bin/env node
// Helper for the Kanbo skill. Talks to the Kanbo Agent API with Node's built-in fetch (no dependencies).
// User text only ever arrives as JSON in a file (--input) or on stdin, never as a command-line argument.
//
// Usage: kanbo.mjs <command> --chat <telegramChatId> [--project <name>] [--task <taskId>] [--status open|done|all] [--input <file.json>]
//        kanbo.mjs link --chat <telegramChatId> --code <8-character code>
// Commands: link, unlink, projects, context, list, get, preview-tasks, create-tasks, preview-update, update-task, preview-delete, delete-task
// Env: KANBO_API_URL (required), KANBO_LINKS_FILE (where chat tokens are kept; default: links.json beside this script)

import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const API_URL = (process.env.KANBO_API_URL ?? "").replace(/\/+$/, "");
const LINKS_FILE = resolve(
  process.env.KANBO_LINKS_FILE || resolve(here, "links.json"),
);
const CHAT_ID = /^-?\d{1,20}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMEOUT_MS = 20_000;
const STDIN_WAIT_MS = 2_000;
const PREVIEW_TTL_MS = 30 * 60 * 1000;
const PREVIEWS_FILE = resolve(dirname(LINKS_FILE), "kanbo-previews.json");
const CODE_FORMAT = /^[A-Za-z0-9]{8}$/;

function done(result, code = 0) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(code);
}

const fail = (error, message, extra = {}) =>
  done({ ok: false, error, message, ...extra }, 1);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i]?.startsWith("--"))
      fail("bad_usage", `Unexpected argument: ${rest[i]}`);
    flags[rest[i].slice(2)] = rest[i + 1];
  }
  return { command, flags };
}

// Waits for stdin only briefly when nothing arrives, so a missing or never-closed pipe cannot hang the run.
function readStdinText() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    const timer = setTimeout(() => resolve(data), STDIN_WAIT_MS);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      clearTimeout(timer);
      data += chunk;
    });
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on("error", () => resolve(data));
  });
}

// The JSON input: from --input <file> when given, otherwise from stdin.
async function readInput(flags, { required = false } = {}) {
  let raw = "";
  if (flags.input) {
    try {
      raw = readFileSync(resolve(flags.input), "utf8");
    } catch {
      return fail(
        "bad_input",
        `Could not read the file given to --input: ${flags.input}`,
      );
    }
  } else {
    raw = await readStdinText();
  }
  if (!raw.trim()) {
    return required
      ? fail(
          "no_input",
          "No JSON input was received. Put it on stdin, or write it to a file and pass --input <file>. Do not run the same command again unchanged.",
        )
      : {};
  }
  try {
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null && !Array.isArray(data))
      return data;
  } catch {}
  return fail("bad_input", "The input must be one JSON object.");
}

// { [chatId]: { projects: { [projectId]: { token, projectName } } } }; the older one-project-per-chat shape is converted on read.
function loadLinks() {
  let saved;
  try {
    saved = JSON.parse(readFileSync(LINKS_FILE, "utf8"));
  } catch {
    return {};
  }
  for (const [chatId, entry] of Object.entries(saved)) {
    if (entry?.projects) continue;
    saved[chatId] = entry?.token
      ? {
          projects: {
            [entry.projectId]: {
              token: entry.token,
              projectName: entry.projectName,
            },
          },
        }
      : { projects: {} };
  }
  return saved;
}

const projectNames = (chatId) =>
  Object.values(loadLinks()[chatId]?.projects ?? {}).map((p) => p.projectName);

function dropLink(links, chatId, projectId) {
  delete links[chatId].projects[projectId];
  if (Object.keys(links[chatId].projects).length === 0) delete links[chatId];
}

function saveLinks(links) {
  mkdirSync(dirname(LINKS_FILE), { recursive: true });
  const temp = `${LINKS_FILE}.tmp`;
  writeFileSync(temp, JSON.stringify(links, null, 2), { mode: 0o600 });
  renameSync(temp, LINKS_FILE);
  try {
    chmodSync(LINKS_FILE, 0o600);
  } catch {}
}

const stable = (value) =>
  Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${stable(value[k])}`)
          .join(",")}}`
      : JSON.stringify(value);

// The same confirmed payload always gets the same key, so a retry can never create the tasks twice.
const idempotencyKey = (chatId, payload) =>
  createHash("sha256")
    .update(`${chatId}\n${stable(payload)}`)
    .digest("hex")
    .slice(0, 48);

async function call(method, path, { token, body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/agent/v1${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail("unreachable", `Could not reach Kanbo at ${API_URL}.`);
  }
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

// Saving is only allowed for a payload that was previewed in the last 30 minutes. Only hashes are kept.
const previewKey = (kind, scope, payload) =>
  createHash("sha256")
    .update(`${kind}\n${scope}\n${stable(payload)}`)
    .digest("hex");

function loadPreviews() {
  try {
    const now = Date.now();
    const saved = JSON.parse(readFileSync(PREVIEWS_FILE, "utf8"));
    return Object.fromEntries(
      Object.entries(saved).filter(([, at]) => now - at < PREVIEW_TTL_MS),
    );
  } catch {
    return {};
  }
}

function recordPreview(key) {
  const previews = loadPreviews();
  previews[key] = Date.now();
  mkdirSync(dirname(PREVIEWS_FILE), { recursive: true });
  const temp = `${PREVIEWS_FILE}.tmp`;
  writeFileSync(temp, JSON.stringify(previews), { mode: 0o600 });
  renameSync(temp, PREVIEWS_FILE);
  try {
    chmodSync(PREVIEWS_FILE, 0o600);
  } catch {}
}

function requirePreview(key) {
  if (key in loadPreviews()) return;
  fail(
    "preview_required",
    "This exact input was not previewed in the last 30 minutes. Run the preview command with the same input, show it to the user, and wait for their reply before saving.",
  );
}

function requireChat(flags) {
  if (!API_URL) fail("not_configured", "KANBO_API_URL is not set.");
  if (
    !/^https:\/\//i.test(API_URL) &&
    !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(API_URL)
  )
    fail(
      "not_configured",
      "KANBO_API_URL must start with https:// (http:// is only allowed for localhost).",
    );
  if (!CHAT_ID.test(flags.chat ?? ""))
    fail("bad_usage", "--chat must be the numeric Telegram chat id.");
  return flags.chat;
}

// The project this command acts on: the one named with --project, or the only one linked to the chat.
function requireLink(chatId, flags) {
  const entries = Object.entries(loadLinks()[chatId]?.projects ?? {});
  if (entries.length === 0) {
    fail(
      "not_linked",
      "This chat is not linked to a Kanbo project. A project admin must generate a code in Kanbo (Connect Chat) and send: link kanbo CODE",
    );
  }
  const wanted = (flags.project ?? "").trim().toLowerCase();
  if (!wanted) {
    if (entries.length === 1)
      return { projectId: entries[0][0], ...entries[0][1] };
    fail(
      "project_required",
      "This chat is linked to several projects. Ask the user which one, then pass --project <name>.",
      { projects: entries.map(([, p]) => p.projectName) },
    );
  }
  const name = ([, p]) => p.projectName.toLowerCase();
  const matches =
    [
      entries.filter(([id]) => id.toLowerCase() === wanted),
      entries.filter((e) => name(e) === wanted),
      entries.filter((e) => name(e).includes(wanted)),
    ].find((found) => found.length > 0) ?? [];
  if (matches.length !== 1) {
    fail(
      matches.length === 0 ? "project_not_found" : "project_ambiguous",
      `${matches.length === 0 ? "No project of this chat matches" : "Several projects match"} "${flags.project}". Ask the user which one.`,
      { projects: entries.map(([, p]) => p.projectName) },
    );
  }
  return { projectId: matches[0][0], ...matches[0][1] };
}

// Any response from Kanbo becomes the helper's output; a revoked token also clears the stale local entry.
function finish(result, chatId, projectId) {
  if (result.status === 401 && chatId) {
    const links = loadLinks();
    if (links[chatId]) dropLink(links, chatId, projectId);
    saveLinks(links);
    return fail(
      "not_linked",
      "This project's link was revoked. A project admin must generate a new code in Kanbo (Connect Chat).",
    );
  }
  if (!result.ok)
    return fail(
      result.data.error ?? "request_failed",
      result.data.message ?? "Kanbo rejected the request.",
      { status: result.status, details: result.data },
    );
  return done({ ok: true, ...result.data });
}

const { command, flags } = parseArgs(process.argv.slice(2));

switch (command) {
  case "link": {
    const chatId = requireChat(flags);
    const code =
      flags.code ?? (await readInput(flags, { required: true })).code;
    if (typeof code !== "string" || !CODE_FORMAT.test(code.trim())) {
      fail(
        "bad_input",
        "The link code must be exactly 8 letters and digits, for example ABCD1234.",
      );
    }
    const result = await call("POST", "/link", {
      body: { code: code.trim(), channel: "telegram", chatId },
    });
    if (!result.ok) {
      const expired = result.status === 410;
      fail(
        result.data.error ?? "request_failed",
        expired
          ? "That code is invalid, expired or already used. A project admin can generate a new one in Kanbo (Connect Chat)."
          : (result.data.message ?? "Kanbo rejected the request."),
        { status: result.status },
      );
    }
    const links = loadLinks();
    links[chatId] ??= { projects: {} };
    links[chatId].projects[result.data.project.id] = {
      token: result.data.token,
      projectName: result.data.project.name,
    };
    saveLinks(links);
    done({ ok: true, linked: true, project: result.data.project });
    break;
  }
  case "unlink": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    await call("DELETE", "/link", { token: link.token });
    const links = loadLinks();
    dropLink(links, chatId, link.projectId);
    saveLinks(links);
    done({ ok: true, unlinked: true, project: link.projectName });
    break;
  }
  case "projects": {
    const chatId = requireChat(flags);
    done({ ok: true, projects: projectNames(chatId) });
    break;
  }
  case "context": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    finish(
      await call("GET", "/context", { token: link.token }),
      chatId,
      link.projectId,
    );
    break;
  }
  case "list": {
    const chatId = requireChat(flags);
    const { q = "" } = await readInput(flags);
    const params = new URLSearchParams({ status: flags.status ?? "open" });
    if (typeof q === "string" && q.trim()) params.set("q", q.trim());
    const link = requireLink(chatId, flags);
    finish(
      await call("GET", `/tasks?${params}`, { token: link.token }),
      chatId,
      link.projectId,
    );
    break;
  }
  case "get": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    if (!UUID.test(flags.task ?? ""))
      fail("bad_usage", "--task must be a task id from the list command.");
    finish(
      await call("GET", `/tasks/${flags.task}`, { token: link.token }),
      chatId,
      link.projectId,
    );
    break;
  }
  case "preview-tasks":
  case "create-tasks": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    const payload = await readInput(flags, { required: true });
    const key = previewKey("tasks", `${chatId}:${link.projectId}`, payload);
    if (command === "preview-tasks") {
      const result = await call("POST", "/tasks", {
        token: link.token,
        body: { ...payload, dryRun: true },
      });
      if (result.ok) recordPreview(key);
      finish(result, chatId, link.projectId);
    } else {
      requirePreview(key);
      finish(
        await call("POST", "/tasks", {
          token: link.token,
          body: { ...payload, dryRun: false },
          headers: {
            "Idempotency-Key": idempotencyKey(
              `${chatId}:${link.projectId}`,
              payload,
            ),
          },
        }),
        chatId,
        link.projectId,
      );
    }
    break;
  }
  case "preview-update":
  case "update-task": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    if (!UUID.test(flags.task ?? ""))
      fail("bad_usage", "--task must be a task id from the list command.");
    const payload = await readInput(flags, { required: true });
    const key = previewKey(
      "update",
      `${chatId}:${link.projectId}:${flags.task}`,
      payload,
    );
    if (command === "preview-update") {
      const result = await call("PATCH", `/tasks/${flags.task}`, {
        token: link.token,
        body: { ...payload, dryRun: true },
      });
      if (result.ok) recordPreview(key);
      finish(result, chatId, link.projectId);
    } else {
      requirePreview(key);
      finish(
        await call("PATCH", `/tasks/${flags.task}`, {
          token: link.token,
          body: { ...payload, dryRun: false },
          headers: {
            "Idempotency-Key": idempotencyKey(
              `${chatId}:${link.projectId}:${flags.task}`,
              payload,
            ),
          },
        }),
        chatId,
        link.projectId,
      );
    }
    break;
  }
  case "preview-delete":
  case "delete-task": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId, flags);
    if (!UUID.test(flags.task ?? ""))
      fail("bad_usage", "--task must be a task id from the list command.");
    const payload = { task: flags.task };
    const key = previewKey("delete", `${chatId}:${link.projectId}`, payload);
    if (command === "preview-delete") {
      const result = await call("DELETE", `/tasks/${flags.task}`, {
        token: link.token,
        body: { dryRun: true },
      });
      if (result.ok) recordPreview(key);
      finish(result, chatId, link.projectId);
    } else {
      requirePreview(key);
      finish(
        await call("DELETE", `/tasks/${flags.task}`, {
          token: link.token,
          body: { dryRun: false },
          headers: {
            "Idempotency-Key": idempotencyKey(
              `${chatId}:${link.projectId}:delete`,
              payload,
            ),
          },
        }),
        chatId,
        link.projectId,
      );
    }
    break;
  }
  default:
    fail(
      "bad_usage",
      "Commands: link, unlink, projects, context, list, get, preview-tasks, create-tasks, preview-update, update-task, preview-delete, delete-task",
    );
}
