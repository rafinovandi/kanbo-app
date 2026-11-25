import { PRIORITY_RANK, UNASSIGNED } from "@/constants/board-constant";
import type { BoardCategory, BoardColumns, BoardTask, BoardView, DueFilter } from "@/types/board";

export function groupTasksByCategory(categories: BoardCategory[], tasks: BoardTask[]): BoardColumns {
  const columns: BoardColumns = Object.fromEntries(categories.map((category) => [category.id, []]));
  for (const task of tasks) columns[task.categoryId]?.push(task);
  for (const id of Object.keys(columns)) columns[id].sort((a, b) => a.position - b.position);
  return columns;
}

// Position between two neighbours (fractional ordering): the middle, or one step past an edge.
export function getPositionBetween(prev?: number, next?: number): number {
  if (prev === undefined && next === undefined) return 1;
  if (prev === undefined) return (next as number) - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

// Moves a task to `toIndex` of another (or the same) column. Returns the new columns and the
// position to save, or null when the task is not found.
export function moveTaskInColumns(
  columns: BoardColumns,
  taskId: string,
  toCategoryId: string,
  toIndex: number,
): { columns: BoardColumns; position: number } | null {
  const fromCategoryId = Object.keys(columns).find((id) => columns[id].some((task) => task.id === taskId));
  const task = fromCategoryId ? columns[fromCategoryId].find((item) => item.id === taskId) : undefined;
  if (!fromCategoryId || !task || !columns[toCategoryId]) return null;

  const target = columns[toCategoryId].filter((item) => item.id !== taskId);
  const index = Math.min(Math.max(toIndex, 0), target.length);
  const position = getPositionBetween(target[index - 1]?.position, target[index]?.position);

  target.splice(index, 0, { ...task, categoryId: toCategoryId, position });
  return {
    columns: {
      ...columns,
      [fromCategoryId]: columns[fromCategoryId].filter((item) => item.id !== taskId),
      [toCategoryId]: target,
    },
    position,
  };
}

export const countActiveFilters = (view: BoardView) =>
  Number(view.mine) + view.priorities.length + view.assigneeIds.length + view.due.length;

// The Sunday that ends the week of `today` ("YYYY-MM-DD").
function endOfWeek(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + ((7 - date.getUTCDay()) % 7));
  return date.toISOString().slice(0, 10);
}

function matchesDue(task: BoardTask, due: DueFilter, today: string, isDone: boolean): boolean {
  if (due === "none") return !task.dueDate;
  if (!task.dueDate) return false;
  if (due === "overdue") return !isDone && task.dueDate < today;
  if (due === "today") return task.dueDate === today;
  return task.dueDate >= today && task.dueDate <= endOfWeek(today);
}

const SORTERS: Record<BoardView["sort"], (a: BoardTask, b: BoardTask) => number> = {
  manual: () => 0,
  due: (a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  name: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
};

// Filters (AND between groups, OR inside a group) and sorts a project's tasks; ties keep board order.
export function applyBoardView(
  tasks: BoardTask[],
  view: BoardView,
  { meId, today, doneIds }: { meId: string; today: string; doneIds: Set<string> },
): BoardTask[] {
  const visible = tasks.filter((task) => {
    const assigneeIds = task.assignees.map((assignee) => assignee.id);
    if (view.mine && !assigneeIds.includes(meId)) return false;
    if (view.priorities.length && !view.priorities.includes(task.priority)) return false;
    if (view.assigneeIds.length) {
      const matches = view.assigneeIds.includes(UNASSIGNED) && assigneeIds.length === 0;
      if (!matches && !assigneeIds.some((id) => view.assigneeIds.includes(id))) return false;
    }
    return !view.due.length || view.due.some((due) => matchesDue(task, due, today, doneIds.has(task.categoryId)));
  });
  return visible.sort((a, b) => SORTERS[view.sort](a, b) || a.position - b.position);
}
