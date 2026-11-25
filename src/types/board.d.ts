import type { CategoryKey } from "./category";
import type { MemberPreview, ProjectColor } from "./project";
import type { TaskPriority } from "./task";

export type BoardCategory = {
  id: string;
  key: CategoryKey | null;
  name: string;
  color: ProjectColor;
};

export type BoardTask = {
  id: string;
  categoryId: string;
  title: string;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  position: number;
  createdBy: string | null;
  assignees: MemberPreview[];
};

export type BoardData = {
  project: {
    id: string;
    name: string;
    description: string;
    color: ProjectColor;
    ownerId: string;
  };
  categories: BoardCategory[];
  tasks: BoardTask[];
};

// Tasks of each column, keyed by category id, in display order.
export type BoardColumns = Record<string, BoardTask[]>;

export type DueFilter = "overdue" | "today" | "week" | "none";

export type BoardView = {
  mine: boolean;
  priorities: TaskPriority[];
  assigneeIds: string[];
  due: DueFilter[];
};
