import type { TaskFormState, TaskPriority } from "@/types/task";

export const TASK_LIMITS = { title: 200, description: 20000, assignees: 20 } as const;
export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

type Errors = NonNullable<TaskFormState["errors"]>;

export const validateTitle = (value: string): { value: string; error?: string } => {
  const title = value.trim();
  if (!title) return { value: title, error: "Task title is required" };
  return title.length > TASK_LIMITS.title
    ? { value: title, error: `Max ${TASK_LIMITS.title} characters` }
    : { value: title };
};

export const validateDescription = (value: string): { value: string; error?: string } => {
  const description = value.trim();
  return description.length > TASK_LIMITS.description
    ? { value: description, error: `Max ${TASK_LIMITS.description} characters` }
    : { value: description };
};

// `today` is "YYYY-MM-DD" in the user's time zone: a due date cannot be before it. An empty value means no date.
export const validateDueDate = (value: string, today: string): { value: string | null; error?: string } => {
  const dueDate = value.trim();
  if (!dueDate) return { value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))) {
    return { value: null, error: "Enter a valid date" };
  }
  return dueDate < today ? { value: null, error: "Due date can't be before today" } : { value: dueDate };
};

// Pure validation shared by the Add Task dialog and the server action. Mirrors the CHECK
// constraints in 004_board.sql.
export function validateNewTask(input: {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  today: string;
}): {
  values: { title: string; description: string; priority: TaskPriority; dueDate: string | null };
  errors: Errors;
} {
  const title = validateTitle(input.title);
  const description = validateDescription(input.description);
  const priority = TASK_PRIORITIES.find((p) => p === input.priority);
  const dueDate = validateDueDate(input.dueDate, input.today);
  const errors: Errors = {};

  if (title.error) errors.title = [title.error];
  if (description.error) errors.description = [description.error];
  if (!priority) errors.priority = ["Pick a priority"];
  if (dueDate.error) errors.due_date = [dueDate.error];

  return {
    values: {
      title: title.value,
      description: description.value,
      priority: priority ?? "medium",
      dueDate: dueDate.value,
    },
    errors,
  };
}

// Reads the assignee ids sent by the dialog (a JSON array of user ids).
export function parseAssigneeIds(raw: string, isUuid: (value: string) => boolean): string[] | null {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > TASK_LIMITS.assignees) return null;
    const ids = data.filter((id): id is string => typeof id === "string" && isUuid(id));
    return ids.length === data.length ? [...new Set(ids)] : null;
  } catch {
    return null;
  }
}
