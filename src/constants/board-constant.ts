import type { BoardSort, BoardView, DueFilter } from "@/types/board";

export const UNASSIGNED = "unassigned";

export const DUE_FILTERS: { label: string; value: DueFilter }[] = [
  { label: "Overdue", value: "overdue" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "No due date", value: "none" },
];

export const SORT_OPTIONS: { label: string; value: BoardSort }[] = [
  { label: "Manual", value: "manual" },
  { label: "Due date", value: "due" },
  { label: "Priority", value: "priority" },
  { label: "Name", value: "name" },
];

export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export const DEFAULT_BOARD_VIEW: BoardView = { mine: false, priorities: [], assigneeIds: [], due: [], sort: "manual" };
