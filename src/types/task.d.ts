import type { Enums, Tables } from "./database.types";

export type Task = Tables<"tasks">;
export type TaskAssignee = Tables<"task_assignees">;
export type TaskPriority = Enums<"task_priority">;

export type TaskWithAssignees = Task & {
  task_assignees: Pick<TaskAssignee, "user_id">[];
};

export type TaskFormState = {
  status?: string;
  // Set on success when the task was saved but its assignees were not.
  assigneesFailed?: boolean;
  errors?: {
    title?: string[];
    description?: string[];
    priority?: string[];
    due_date?: string[];
    category_id?: string[];
    _form?: string[];
  };
};
