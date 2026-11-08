import "server-only";

import { failure, type AgentLinkContext, type ApiResult } from "@/lib/agent/http";
import { boardUrl } from "@/lib/agent/shared";
import { getTodayInTimeZone } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";
import { TASK_LIMITS, TASK_PRIORITIES, validateDueDate } from "@/validations/task";

// The project data the agent needs (columns, active members, today's date) and the helpers that turn
// what an agent sends (column names, member names, priority, due date) into real values.

export async function loadProject(ctx: AgentLinkContext) {
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

export type Project = Awaited<ReturnType<typeof loadProject>>;

export async function getContext(ctx: AgentLinkContext): Promise<ApiResult> {
  const { project, categories, members } = await loadProject(ctx);
  if (!project) return failure(404, "not_found", "Project not found.");
  return {
    status: 200,
    body: {
      project: { id: project.id, name: project.name, url: boardUrl(project.id) },
      categories: categories.map(({ id, name, key }) => ({ id, name, key })),
      members: members.map(({ name }) => ({ name })),
    },
  };
}

export const norm = (value: string) => value.trim().toLowerCase();

export function findCategory(data: Project, value: unknown) {
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

export function resolveAssignees(data: Project, value: unknown, warn: (message: string) => void) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    warn("assignees must be a list of member names, so the assignees were left unchanged.");
    return undefined;
  }
  const names = value.filter((v): v is string => typeof v === "string");
  const found = new Map<string, { id: string; name: string }>();
  for (const name of names.slice(0, TASK_LIMITS.assignees)) {
    const member = findMember(data, name);
    if (member) found.set(member.id, { id: member.id, name: member.name });
    else warn(`"${name}" is not an active member, so they were not assigned.`);
  }
  if (names.length > 0 && found.size === 0) {
    warn("None of the assignees matched an active member, so the assignees were left unchanged.");
    return undefined;
  }
  return [...found.values()];
}

export function resolvePriority(value: unknown, warn: (message: string) => void): TaskPriority | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const found = TASK_PRIORITIES.find((p) => p === norm(String(value)));
  if (!found) warn(`Priority "${String(value)}" is not low, medium or high.`);
  return found;
}

export function resolveDueDate(data: Project, value: unknown, warn: (message: string) => void) {
  if (value === undefined) return undefined;
  if (value !== null && typeof value !== "string") {
    warn("dueDate must be a YYYY-MM-DD string or null, so the due date was left unchanged.");
    return undefined;
  }
  const checked = validateDueDate(value ?? "", data.today);
  if (checked.error) {
    warn(`Due date ${JSON.stringify(value)} was ignored: ${checked.error.toLowerCase()}.`);
    return undefined;
  }
  return checked.value;
}
