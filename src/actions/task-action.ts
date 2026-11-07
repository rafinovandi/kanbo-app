"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getTodayInTimeZone } from "@/lib/utils";
import type { TaskFormState, TaskPriority } from "@/types/task";
import {
  parseAssigneeIds,
  TASK_PRIORITIES,
  validateDescription,
  validateDueDate,
  validateNewTask,
  validateTitle,
} from "@/validations/task";

export type TaskActionResult = { status: "success" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "You don't have permission to do that.";
const FAILED = "Something went wrong. Try again.";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

// The caller's Supabase client, or null when the session is gone. Access rules (members of the
// project only, admins delete) are enforced by RLS; these actions only report the result.
async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

// Adds a task at the bottom of a column, then its assignees. The task's column must belong to its
// project (composite foreign key), only members of the project can insert (RLS), and only active
// members can be assigned (trigger). A due date cannot be before today in the user's time zone.
export async function createTaskAction(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const projectId = text(formData, "project_id");
  const categoryId = text(formData, "category_id");
  const assigneeIds = parseAssigneeIds(text(formData, "assignee_ids"), (id) => UUID.test(id));

  const supabase = await getSession();
  if (!supabase) return { status: "error", errors: { _form: ["Your session expired. Sign in again."] } };
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const { data: me } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId ?? "")
    .maybeSingle();

  const { values, errors } = validateNewTask({
    title: text(formData, "title"),
    description: text(formData, "description"),
    priority: text(formData, "priority"),
    dueDate: text(formData, "due_date"),
    today: getTodayInTimeZone(me?.timezone ?? "UTC"),
  });
  if (!UUID.test(projectId) || !UUID.test(categoryId) || !assigneeIds) errors._form = [FAILED];
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const { data: last } = await supabase
    .from("tasks")
    .select("position")
    .eq("category_id", categoryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      category_id: categoryId,
      title: values.title,
      description: values.description,
      priority: values.priority,
      due_date: values.dueDate,
      position: (last?.position ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error || !task) return { status: "error", errors: { _form: ["Could not add the task. Try again."] } };

  let assigneesFailed = false;
  if (assigneeIds && assigneeIds.length > 0) {
    const { error: assignError } = await supabase
      .from("task_assignees")
      .insert(assigneeIds.map((assigneeId) => ({ task_id: task.id, user_id: assigneeId })));
    assigneesFailed = !!assignError;
  }

  revalidatePath("/", "layout");
  return { status: "success", assigneesFailed };
}

// Saves a drop: the task's column and its position among the neighbours (without one, the bottom of the column).
export async function moveTaskAction(taskId: string, categoryId: string, position?: number): Promise<TaskActionResult> {
  if (!UUID.test(taskId) || !UUID.test(categoryId) || (position !== undefined && !Number.isFinite(position))) {
    return { status: "error", message: FAILED };
  }

  const supabase = await getSession();
  if (!supabase) return { status: "error", message: "Your session expired. Sign in again." };

  let nextPosition = position;
  if (nextPosition === undefined) {
    const { data: last } = await supabase
      .from("tasks")
      .select("position")
      .eq("category_id", categoryId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    nextPosition = (last?.position ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ category_id: categoryId, position: nextPosition })
    .eq("id", taskId)
    .select("id");
  if (error) return { status: "error", message: FAILED };
  return data.length > 0 ? { status: "success" } : { status: "error", message: NOT_ALLOWED };
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult> {
  if (!UUID.test(taskId)) return { status: "error", message: FAILED };

  const supabase = await getSession();
  if (!supabase) return { status: "error", message: "Your session expired. Sign in again." };

  const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select("id");
  if (error) return { status: "error", message: FAILED };
  if (data.length === 0) return { status: "error", message: NOT_ALLOWED };

  revalidatePath("/", "layout");
  return { status: "success" };
}

export type TaskPatch = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
};

// Saves one or more fields of a task (the task modal). A due date is only checked against today when it
// differs from the saved one, so a task that is already overdue can keep its date.
export async function updateTaskAction(taskId: string, patch: TaskPatch): Promise<TaskActionResult> {
  if (!UUID.test(taskId)) return { status: "error", message: FAILED };

  const supabase = await getSession();
  if (!supabase) return { status: "error", message: "Your session expired. Sign in again." };

  const update: { title?: string; description?: string; priority?: TaskPriority; due_date?: string | null } = {};

  if (patch.title !== undefined) {
    const title = validateTitle(patch.title);
    if (title.error) return { status: "error", message: title.error };
    update.title = title.value;
  }
  if (patch.description !== undefined) {
    const description = validateDescription(patch.description);
    if (description.error) return { status: "error", message: description.error };
    update.description = description.value;
  }
  if (patch.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(patch.priority)) return { status: "error", message: FAILED };
    update.priority = patch.priority;
  }
  if (patch.dueDate !== undefined) {
    const { data: current } = await supabase.from("tasks").select("due_date").eq("id", taskId).maybeSingle();
    if (!current) return { status: "error", message: NOT_ALLOWED };
    if ((patch.dueDate ?? null) !== current.due_date) {
      const { data: claims } = await supabase.auth.getClaims();
      const { data: me } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", claims?.claims?.sub ?? "")
        .maybeSingle();
      const dueDate = validateDueDate(patch.dueDate ?? "", getTodayInTimeZone(me?.timezone ?? "UTC"));
      if (dueDate.error) return { status: "error", message: dueDate.error };
      update.due_date = dueDate.value;
    }
  }
  if (Object.keys(update).length === 0) return { status: "success" };

  const { data, error } = await supabase.from("tasks").update(update).eq("id", taskId).select("id");
  if (error) return { status: "error", message: FAILED };
  if (data.length === 0) return { status: "error", message: NOT_ALLOWED };

  revalidatePath("/", "layout");
  return { status: "success" };
}

// Makes the assignees of a task exactly `assigneeIds` (adds the new ones, removes the rest). Only active
// members of the project can be assigned (trigger).
export async function setTaskAssigneesAction(taskId: string, assigneeIds: string[]): Promise<TaskActionResult> {
  const ids = parseAssigneeIds(JSON.stringify(assigneeIds), (id) => UUID.test(id));
  if (!UUID.test(taskId) || !ids) return { status: "error", message: FAILED };

  const supabase = await getSession();
  if (!supabase) return { status: "error", message: "Your session expired. Sign in again." };

  const { data: current, error: readError } = await supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);
  if (readError) return { status: "error", message: FAILED };

  const existing = current.map((row) => row.user_id);
  const toAdd = ids.filter((id) => !existing.includes(id));
  const toRemove = existing.filter((id) => !ids.includes(id));

  if (toRemove.length > 0) {
    const { error } = await supabase.from("task_assignees").delete().eq("task_id", taskId).in("user_id", toRemove);
    if (error) return { status: "error", message: FAILED };
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("task_assignees")
      .insert(toAdd.map((userId) => ({ task_id: taskId, user_id: userId })));
    if (error) return { status: "error", message: FAILED };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
