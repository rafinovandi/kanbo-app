import "server-only";

import { createHash } from "node:crypto";

import { environment } from "@/configs/environment";
import {
  clientKey,
  failure,
  isApiResult,
  readJson,
  type AdminClient,
  type AgentLinkContext,
  type ApiResult,
} from "@/lib/agent/http";
import { createChatToken, hashAgentSecret, normalizeLinkCode } from "@/lib/agent/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeLikePattern, getTodayInTimeZone } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";
import { TASK_LIMITS, TASK_PRIORITIES, validateDescription, validateDueDate, validateTitle } from "@/validations/task";

const MAX_TASKS_PER_REQUEST = 20;
const LIST_LIMIT = 50;
const CHAT_ID = /^-?\d{1,20}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalid = (message: string) => failure(422, "validation_failed", message);
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const boardUrl = (projectId: string) => `${environment.APP_URL}/projects/${projectId}`;

// ── link / unlink ──

// Trades a one-time code for a chat token. The code is consumed in one UPDATE, so it can only win once.
export async function linkChat(request: Request): Promise<ApiResult> {
  if (!environment.AGENT_ENABLED) return failure(404, "agent_disabled", "Not found");

  const admin = createAdminClient();
  const { data: limit } = await admin.rpc("agent_link_rate_limit", { p_client_hash: clientKey(request) });
  if (!limit?.[0]?.allowed) {
    return failure(429, "rate_limited", "Too many attempts. Try again shortly.", {
      "Retry-After": String(limit?.[0]?.retry_after ?? 60),
    });
  }

  const parsed = await readJson(request);
  if (isApiResult(parsed)) return parsed;
  const code = normalizeLinkCode(text(parsed.data.code, 32));
  const chatId = text(parsed.data.chatId, 64);
  if (!code || parsed.data.channel !== "telegram" || !CHAT_ID.test(chatId)) {
    return invalid("Send { code, channel: \"telegram\", chatId } with a numeric chatId.");
  }

  const { data: used } = await admin
    .from("agent_link_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code_hash", hashAgentSecret("link-code", code))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("project_id, bot_id, created_by")
    .maybeSingle();
  const gone = failure(410, "code_expired", "This code is invalid, expired or already used.");
  if (!used) return gone;

  const [{ data: bot }, { data: stillAdmin }, { data: project }] = await Promise.all([
    admin.from("agent_bots").select("id").eq("id", used.bot_id).is("revoked_at", null).maybeSingle(),
    admin
      .from("project_members")
      .select("id")
      .eq("project_id", used.project_id)
      .eq("user_id", used.created_by)
      .eq("status", "active")
      .eq("is_admin", true)
      .maybeSingle(),
    admin.from("projects").select("id, name").eq("id", used.project_id).maybeSingle(),
  ]);
  if (!bot || !stillAdmin || !project) return gone;

  await admin
    .from("agent_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("channel", "telegram")
    .eq("chat_id", chatId)
    .is("revoked_at", null);

  const token = createChatToken();
  const { error } = await admin.from("agent_links").insert({
    project_id: used.project_id,
    bot_id: used.bot_id,
    channel: "telegram",
    chat_id: chatId,
    token_hash: hashAgentSecret("chat-token", token),
    linked_by: used.created_by,
  });
  if (error) return failure(500, "link_failed", "Could not link this chat. Try again with a new code.");

  return { status: 200, body: { token, project: { id: project.id, name: project.name, url: boardUrl(project.id) } } };
}

export async function unlinkChat(ctx: AgentLinkContext): Promise<ApiResult> {
  await ctx.admin.from("agent_links").update({ revoked_at: new Date().toISOString() }).eq("id", ctx.id);
  return { status: 200, body: { revoked: true } };
}

// ── project data the agent needs ──

async function loadProject(ctx: AgentLinkContext) {
  const [{ data: project }, { data: categories }, { data: rows }, { data: admin }] = await Promise.all([
    ctx.admin.from("projects").select("id, name").eq("id", ctx.projectId).single(),
    ctx.admin.from("categories").select("id, name, key, position").eq("project_id", ctx.projectId).order("position"),
    ctx.admin
      .from("project_members")
      .select("user_id, email, profiles!project_members_user_id_fkey(name)")
      .eq("project_id", ctx.projectId)
      .eq("status", "active"),
    ctx.admin.from("profiles").select("timezone").eq("id", ctx.linkedBy).maybeSingle(),
  ]);

  const members = (rows ?? [])
    .filter((row): row is typeof row & { user_id: string } => row.user_id !== null)
    .map((row) => ({ id: row.user_id, email: row.email, name: row.profiles?.name ?? row.email }));

  return { project, categories: categories ?? [], members, today: getTodayInTimeZone(admin?.timezone ?? "UTC") };
}

type Project = Awaited<ReturnType<typeof loadProject>>;

export async function getContext(ctx: AgentLinkContext): Promise<ApiResult> {
  const { project, categories, members } = await loadProject(ctx);
  if (!project) return failure(404, "not_found", "Project not found.");
  return {
    status: 200,
    body: {
      project: { id: project.id, name: project.name, url: boardUrl(project.id) },
      categories: categories.map(({ id, name, key }) => ({ id, name, key })),
      members: members.map(({ name, email }) => ({ name, email })),
    },
  };
}

const norm = (value: string) => value.trim().toLowerCase();

function findCategory(data: Project, value: unknown) {
  const wanted = norm(typeof value === "string" ? value : "");
  if (!wanted) return undefined;
  return data.categories.find((c) => norm(c.name) === wanted || c.key === wanted || c.id === value);
}

// Email, full name, or a first name that only one member has.
function findMember(data: Project, value: string) {
  const wanted = norm(value.replace(/^@/, ""));
  const exact = data.members.find((m) => norm(m.email) === wanted || norm(m.name) === wanted);
  if (exact) return exact;
  const byFirstName = data.members.filter((m) => norm(m.name).split(/\s+/)[0] === wanted);
  return byFirstName.length === 1 ? byFirstName[0] : undefined;
}

function resolveAssignees(data: Project, value: unknown, warn: (message: string) => void) {
  if (value === undefined) return undefined;
  const names = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  const found = new Map<string, { id: string; name: string }>();
  for (const name of names.slice(0, TASK_LIMITS.assignees)) {
    const member = findMember(data, name);
    if (member) found.set(member.id, { id: member.id, name: member.name });
    else warn(`"${name}" is not an active member, so they were not assigned.`);
  }
  return [...found.values()];
}

function resolvePriority(value: unknown, warn: (message: string) => void): TaskPriority | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const found = TASK_PRIORITIES.find((p) => p === norm(String(value)));
  if (!found) warn(`Priority "${String(value)}" is not low, medium or high.`);
  return found;
}

function resolveDueDate(data: Project, value: unknown, warn: (message: string) => void) {
  if (value === undefined) return undefined;
  const checked = validateDueDate(typeof value === "string" ? value : "", data.today);
  if (checked.error) warn(`Due date ${JSON.stringify(value)} was ignored: ${checked.error.toLowerCase()}.`);
  return checked.value;
}

// ── idempotency ──

const hashPayload = (raw: string) => createHash("sha256").update(raw).digest("hex");

// Real (non-dry-run) writes need an Idempotency-Key. A retry with the same key and body replays the first answer;
// the same key with a different body is a conflict.
async function runIdempotent(
  ctx: AgentLinkContext,
  request: Request,
  raw: string,
  handler: () => Promise<ApiResult>,
): Promise<ApiResult> {
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!key || key.length > 128) {
    return failure(422, "idempotency_key_required", "Send an Idempotency-Key header (1 to 128 characters) when saving.");
  }

  const payloadHash = hashPayload(raw);
  const { data: previous } = await ctx.admin
    .from("agent_requests")
    .select("payload_hash, response_status, response_body")
    .eq("token_id", ctx.id)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (previous) {
    if (previous.payload_hash !== payloadHash) {
      return failure(409, "idempotency_conflict", "This Idempotency-Key was already used with a different request.");
    }
    return { status: previous.response_status, body: previous.response_body, headers: { "Idempotent-Replay": "true" } };
  }

  const result = await handler();
  if (result.status >= 200 && result.status < 300) {
    await ctx.admin.from("agent_requests").insert({
      token_id: ctx.id,
      idempotency_key: key,
      payload_hash: payloadHash,
      response_status: result.status,
      response_body: result.body as never,
    });
  }
  return result;
}

// ── tasks ──

type PreparedTask = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  category: { id: string; name: string };
  assignees: { id: string; name: string }[];
  warnings: string[];
};

function prepareTask(data: Project, input: unknown, index: number): PreparedTask | string {
  const item = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const title = validateTitle(typeof item.title === "string" ? item.title : "");
  const description = validateDescription(typeof item.description === "string" ? item.description : "");
  if (title.error || description.error) return `tasks[${index}]: ${title.error ?? description.error}.`;

  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const category = findCategory(data, item.category) ?? data.categories[0];
  if (item.category !== undefined && item.category !== null && !findCategory(data, item.category)) {
    warn(`Column ${JSON.stringify(item.category)} does not exist, so the first column was used.`);
  }

  return {
    title: title.value,
    description: description.value,
    priority: resolvePriority(item.priority, warn) ?? "medium",
    dueDate: resolveDueDate(data, item.dueDate, warn) ?? null,
    category: { id: category.id, name: category.name },
    assignees: resolveAssignees(data, item.assignees, warn) ?? [],
    warnings,
  };
}

async function nextPositions(admin: AdminClient, categoryIds: string[]) {
  const positions = new Map<string, number>();
  await Promise.all(
    [...new Set(categoryIds)].map(async (id) => {
      const { data } = await admin
        .from("tasks")
        .select("position")
        .eq("category_id", id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      positions.set(id, data?.position ?? 0);
    }),
  );
  return positions;
}

export async function createTasks(ctx: AgentLinkContext, request: Request): Promise<ApiResult> {
  const parsed = await readJson(request);
  if (isApiResult(parsed)) return parsed;
  const { data: body, raw } = parsed;

  const list = body.tasks;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_TASKS_PER_REQUEST) {
    return invalid(`Send 1 to ${MAX_TASKS_PER_REQUEST} tasks in "tasks".`);
  }

  const data = await loadProject(ctx);
  if (!data.project || data.categories.length === 0) return failure(404, "not_found", "Project not found.");

  const prepared: PreparedTask[] = [];
  for (const [index, input] of list.entries()) {
    const task = prepareTask(data, input, index);
    if (typeof task === "string") return invalid(task);
    prepared.push(task);
  }

  const warnings = prepared.flatMap((task, index) => task.warnings.map((message) => ({ index, message })));
  const preview = prepared.map(({ title, description, priority, dueDate, category, assignees }) => ({
    title,
    description,
    priority,
    dueDate,
    category,
    assignees,
  }));
  if (body.dryRun === true) return { status: 200, body: { dryRun: true, tasks: preview, warnings } };

  return runIdempotent(ctx, request, raw, async () => {
    const positions = await nextPositions(ctx.admin, prepared.map((t) => t.category.id));
    const sender = text(body.sender, 64) || null;

    const { data: rows, error } = await ctx.admin
      .from("tasks")
      .insert(
        prepared.map((task) => {
          const position = (positions.get(task.category.id) ?? 0) + 1;
          positions.set(task.category.id, position);
          return {
            project_id: ctx.projectId,
            category_id: task.category.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.dueDate,
            position,
            created_by: ctx.linkedBy,
            source: "agent" as const,
            source_channel: "telegram",
            source_sender: sender,
          };
        }),
      )
      .select("id, title");
    if (error || !rows) return failure(500, "create_failed", "Could not save the tasks.");

    const assignments = rows.flatMap((row, i) => prepared[i].assignees.map((a) => ({ task_id: row.id, user_id: a.id })));
    if (assignments.length > 0) {
      const { error: assignError } = await ctx.admin.from("task_assignees").insert(assignments);
      if (assignError) warnings.push({ index: -1, message: "The tasks were saved, but their assignees could not be set." });
    }

    return {
      status: 201,
      body: { created: rows.map(({ id, title }) => ({ id, title })), url: boardUrl(ctx.projectId), warnings },
    };
  });
}

export async function listTasks(ctx: AgentLinkContext, request: Request): Promise<ApiResult> {
  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "open";
  if (!["open", "done", "all"].includes(status)) return invalid('status must be "open", "done" or "all".');
  const q = (params.get("q") ?? "").trim().slice(0, 100);

  const data = await loadProject(ctx);
  let query = ctx.admin
    .from("tasks")
    .select("id, title, priority, due_date, completed_at, category_id")
    .eq("project_id", ctx.projectId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (status === "open") query = query.is("completed_at", null);
  if (status === "done") query = query.not("completed_at", "is", null);
  if (q) query = query.ilike("title", `%${escapeLikePattern(q)}%`);

  const { data: tasks, error } = await query;
  if (error) return failure(500, "list_failed", "Could not load tasks.");

  const { data: assigned } = await ctx.admin
    .from("task_assignees")
    .select("task_id, user_id")
    .in("task_id", tasks.map((t) => t.id));
  const nameOf = new Map(data.members.map((m) => [m.id, m.name]));
  const categoryOf = new Map(data.categories.map((c) => [c.id, c.name]));

  return {
    status: 200,
    body: {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.due_date,
        category: categoryOf.get(task.category_id) ?? null,
        done: task.completed_at !== null,
        assignees: (assigned ?? []).filter((a) => a.task_id === task.id).map((a) => nameOf.get(a.user_id) ?? "Former member"),
      })),
    },
  };
}

export async function updateTask(ctx: AgentLinkContext, request: Request, taskId: string): Promise<ApiResult> {
  if (!UUID.test(taskId)) return failure(404, "not_found", "Task not found.");
  const parsed = await readJson(request);
  if (isApiResult(parsed)) return parsed;
  const { data: body, raw } = parsed;

  const [data, { data: task }] = await Promise.all([
    loadProject(ctx),
    ctx.admin
      .from("tasks")
      .select("id, title, priority, due_date, category_id")
      .eq("id", taskId)
      .eq("project_id", ctx.projectId)
      .maybeSingle(),
  ]);
  if (!task) return failure(404, "not_found", "Task not found.");

  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const nameOfCategory = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "";

  const patch: { category_id?: string; position?: number; priority?: TaskPriority; due_date?: string | null } = {};
  const changes: { field: string; from: unknown; to: unknown }[] = [];

  if (body.category !== undefined) {
    const category = findCategory(data, body.category);
    if (!category) return invalid(`Column ${JSON.stringify(body.category)} does not exist.`);
    if (category.id !== task.category_id) {
      patch.category_id = category.id;
      changes.push({ field: "category", from: nameOfCategory(task.category_id), to: category.name });
    }
  }
  const priority = resolvePriority(body.priority, warn);
  if (priority && priority !== task.priority) {
    patch.priority = priority;
    changes.push({ field: "priority", from: task.priority, to: priority });
  }
  const dueDate = resolveDueDate(data, body.dueDate, warn);
  if (dueDate !== undefined && dueDate !== task.due_date) {
    patch.due_date = dueDate;
    changes.push({ field: "dueDate", from: task.due_date, to: dueDate });
  }
  const assignees = resolveAssignees(data, body.assignees, warn);
  if (assignees) changes.push({ field: "assignees", from: undefined, to: assignees.map((a) => a.name) });

  if (changes.length === 0) return { status: 200, body: { id: task.id, title: task.title, changes: [], warnings } };
  if (body.dryRun === true) return { status: 200, body: { dryRun: true, id: task.id, title: task.title, changes, warnings } };

  return runIdempotent(ctx, request, raw, async () => {
    if (patch.category_id) {
      const positions = await nextPositions(ctx.admin, [patch.category_id]);
      patch.position = (positions.get(patch.category_id) ?? 0) + 1;
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await ctx.admin.from("tasks").update(patch).eq("id", task.id);
      if (error) return failure(500, "update_failed", "Could not update the task.");
    }
    if (assignees) {
      const { error: clearError } = await ctx.admin.from("task_assignees").delete().eq("task_id", task.id);
      const { error: setError } =
        assignees.length > 0
          ? await ctx.admin.from("task_assignees").insert(assignees.map((a) => ({ task_id: task.id, user_id: a.id })))
          : { error: null };
      if (clearError || setError) warn("The task was updated, but its assignees could not be changed.");
    }
    return { status: 200, body: { id: task.id, title: task.title, changes, url: boardUrl(ctx.projectId), warnings } };
  });
}
