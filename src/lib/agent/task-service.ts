import "server-only";

import { failure, isApiResult, readJson, type AdminClient, type AgentLinkContext, type ApiResult } from "@/lib/agent/http";
import { runIdempotent } from "@/lib/agent/idempotency";
import { notifyProject } from "@/lib/agent/notify";
import {
  findCategory,
  loadProject,
  resolveAssignees,
  resolveDueDate,
  resolvePriority,
  type Project,
} from "@/lib/agent/project-context";
import { boardUrl, invalid, text } from "@/lib/agent/shared";
import { escapeLikePattern } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";
import { validateDescription, validateTitle } from "@/validations/task";

const MAX_TASKS_PER_REQUEST = 20;
const LIST_LIMIT = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  return runIdempotent(ctx, request, "tasks.create", raw, async () => {
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
            source_channel: ctx.kind === "mcp" ? "mcp" : "telegram",
            source_sender: ctx.agentLabel.slice(0, 64),
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

    for (const row of rows) {
      notifyProject({
        projectId: ctx.projectId,
        taskId: row.id,
        event: "task.created",
        actorLabel: sender ? `${sender} (via agent)` : "the agent",
        exceptLinkId: ctx.id,
      });
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

  return runIdempotent(ctx, request, `tasks.update:${task.id}`, raw, async () => {
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
    if (patch.category_id) {
      const sender = text(body.sender, 64);
      notifyProject({
        projectId: ctx.projectId,
        taskId: task.id,
        event: "task.completed",
        actorLabel: sender ? `${sender} (via agent)` : "the agent",
        exceptLinkId: ctx.id,
        previousCategoryId: task.category_id,
      });
    }
    return { status: 200, body: { id: task.id, title: task.title, changes, url: boardUrl(ctx.projectId), warnings } };
  });
}
