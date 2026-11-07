#!/usr/bin/env node
// Helper for the Kanbo skill. Talks to the Kanbo Agent API with Node's built-in fetch (no dependencies).
// User text only ever arrives as JSON on stdin, never as a command-line argument.
//
// Usage: node kanbo.mjs <command> --chat <telegramChatId> [--task <taskId>] [--status open|done|all]
// Commands: link, unlink, context, list, preview-tasks, create-tasks, preview-update, update-task
// Env: KANBO_API_URL (required), KANBO_LINKS_FILE (where chat tokens are kept; default: links.json beside this script)

import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const API_URL = (process.env.KANBO_API_URL ?? "").replace(/\/+$/, "");
const LINKS_FILE = resolve(process.env.KANBO_LINKS_FILE || resolve(here, "links.json"));
const CHAT_ID = /^-?\d{1,20}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMEOUT_MS = 20_000;

function done(result, code = 0) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(code);
}

const fail = (error, message, extra = {}) => done({ ok: false, error, message, ...extra }, 1);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i]?.startsWith("--")) fail("bad_usage", `Unexpected argument: ${rest[i]}`);
    flags[rest[i].slice(2)] = rest[i + 1];
  }
  return { command, flags };
}

async function readStdin() {
  if (process.stdin.isTTY) return {};
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) return {};
  try {
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null && !Array.isArray(data)) return data;
  } catch {}
  return fail("bad_input", "stdin must be one JSON object.");
}

function loadLinks() {
  try {
    return JSON.parse(readFileSync(LINKS_FILE, "utf8"));
  } catch {
    return {};
  }
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
      ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`
      : JSON.stringify(value);

// The same confirmed payload always gets the same key, so a retry can never create the tasks twice.
const idempotencyKey = (chatId, payload) =>
  createHash("sha256").update(`${chatId}\n${stable(payload)}`).digest("hex").slice(0, 48);

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

function requireChat(flags) {
  if (!API_URL) fail("not_configured", "KANBO_API_URL is not set.");
  if (!CHAT_ID.test(flags.chat ?? "")) fail("bad_usage", "--chat must be the numeric Telegram chat id.");
  return flags.chat;
}

function requireLink(chatId) {
  const link = loadLinks()[chatId];
  if (!link?.token) {
    fail("not_linked", "This chat is not linked to a Kanbo project. A project admin must generate a code in Kanbo (Connect Chat) and send: link kanbo CODE");
  }
  return link;
}

// Any response from Kanbo becomes the helper's output; a revoked token also clears the stale local entry.
function finish(result, chatId) {
  if (result.status === 401 && chatId) {
    const links = loadLinks();
    delete links[chatId];
    saveLinks(links);
    return fail("not_linked", "This chat's link was revoked. A project admin must generate a new code in Kanbo (Connect Chat).");
  }
  if (!result.ok) return fail(result.data.error ?? "request_failed", result.data.message ?? "Kanbo rejected the request.", { status: result.status, details: result.data });
  return done({ ok: true, ...result.data });
}

const { command, flags } = parseArgs(process.argv.slice(2));

switch (command) {
  case "link": {
    const chatId = requireChat(flags);
    const { code } = await readStdin();
    if (typeof code !== "string" || !code.trim()) fail("bad_input", 'stdin must be {"code":"ABCD1234"}.');
    const result = await call("POST", "/link", { body: { code, channel: "telegram", chatId } });
    if (!result.ok) {
      const expired = result.status === 410;
      fail(result.data.error ?? "request_failed", expired ? "That code is invalid, expired or already used. A project admin can generate a new one in Kanbo (Connect Chat)." : (result.data.message ?? "Kanbo rejected the request."), { status: result.status });
    }
    const links = loadLinks();
    links[chatId] = { token: result.data.token, projectId: result.data.project.id, projectName: result.data.project.name };
    saveLinks(links);
    done({ ok: true, linked: true, project: result.data.project });
    break;
  }
  case "unlink": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId);
    await call("DELETE", "/link", { token: link.token });
    const links = loadLinks();
    delete links[chatId];
    saveLinks(links);
    done({ ok: true, unlinked: true });
    break;
  }
  case "context": {
    const chatId = requireChat(flags);
    finish(await call("GET", "/context", { token: requireLink(chatId).token }), chatId);
    break;
  }
  case "list": {
    const chatId = requireChat(flags);
    const { q = "" } = await readStdin();
    const params = new URLSearchParams({ status: flags.status ?? "open" });
    if (typeof q === "string" && q.trim()) params.set("q", q.trim());
    finish(await call("GET", `/tasks?${params}`, { token: requireLink(chatId).token }), chatId);
    break;
  }
  case "preview-tasks":
  case "create-tasks": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId);
    const payload = await readStdin();
    if (command === "preview-tasks") {
      finish(await call("POST", "/tasks", { token: link.token, body: { ...payload, dryRun: true } }), chatId);
    } else {
      const body = { ...payload, dryRun: false };
      finish(await call("POST", "/tasks", { token: link.token, body, headers: { "Idempotency-Key": idempotencyKey(chatId, payload) } }), chatId);
    }
    break;
  }
  case "preview-update":
  case "update-task": {
    const chatId = requireChat(flags);
    const link = requireLink(chatId);
    if (!UUID.test(flags.task ?? "")) fail("bad_usage", "--task must be a task id from the list command.");
    const payload = await readStdin();
    if (command === "preview-update") {
      finish(await call("PATCH", `/tasks/${flags.task}`, { token: link.token, body: { ...payload, dryRun: true } }), chatId);
    } else {
      const body = { ...payload, dryRun: false };
      finish(await call("PATCH", `/tasks/${flags.task}`, { token: link.token, body, headers: { "Idempotency-Key": idempotencyKey(`${chatId}:${flags.task}`, payload) } }), chatId);
    }
    break;
  }
  default:
    fail("bad_usage", "Commands: link, unlink, context, list, preview-tasks, create-tasks, preview-update, update-task");
}
