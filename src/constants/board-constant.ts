import type { BoardView, DueFilter } from "@/types/board";

export const UNASSIGNED = "unassigned";

export const DUE_FILTERS: { label: string; value: DueFilter }[] = [
  { label: "Overdue", value: "overdue" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "No due date", value: "none" },
];

export const DEFAULT_BOARD_VIEW: BoardView = {
  mine: false,
  priorities: [],
  assigneeIds: [],
  due: [],
};
