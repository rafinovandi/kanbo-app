import { FolderAdd, Kanban, People, type Icon } from "iconsax-react";

import type { TaskPriority } from "@/types/task";

// "How it works" steps in the My Tasks empty state (design: "My Tasks (empty, new user)").
export const MY_TASKS_STEPS: {
  title: string;
  description: string;
  icon: Icon;
  toneClass: string;
}[] = [
  {
    title: "1. Create a project",
    description: "Name it and pick a color.",
    icon: FolderAdd,
    toneClass: "bg-kb-blue-tint text-kb-blue-fg",
  },
  {
    title: "2. Add tasks",
    description: "Move them from To Do to Done.",
    icon: Kanban,
    toneClass: "bg-kb-orange-tint text-kb-orange-fg",
  },
  {
    title: "3. Invite your team",
    description: "Assign tasks once they join.",
    icon: People,
    toneClass: "bg-kb-lilac-tint text-kb-lilac-fg",
  },
];

// Task rows shown per project before "See More".
export const MAX_TASK_ROWS = 5;

// Sort order of a task's status: Review, In Progress, custom columns, To Do, Done.
export const TASK_STATUS_ORDER = { review: 0, progress: 1, custom: 2, todo: 3, done: 4 } as const;

export const TASK_PRIORITY_CHIP: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-kb-red-tint text-kb-red-fg" },
  medium: { label: "Medium", className: "bg-kb-yellow-tint text-kb-yellow-fg" },
  low: { label: "Low", className: "bg-kb-lilac-tint text-kb-lilac-fg" },
};
