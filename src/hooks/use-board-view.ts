import { useState } from "react";

import { DEFAULT_BOARD_VIEW } from "@/constants/board-constant";
import { countActiveFilters } from "@/lib/board";
import type { BoardView } from "@/types/board";
import type { TaskPriority } from "@/types/task";

const toggle = <T>(list: T[], value: T) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

// Filter choices of the Board, kept on the client.
export default function useBoardView() {
  const [view, setView] = useState<BoardView>(DEFAULT_BOARD_VIEW);

  const handleToggleMine = () =>
    setView((current) => ({ ...current, mine: !current.mine }));
  const handleTogglePriority = (priority: TaskPriority) =>
    setView((current) => ({
      ...current,
      priorities: toggle(current.priorities, priority),
    }));
  const handleToggleAssignee = (id: string) =>
    setView((current) => ({
      ...current,
      assigneeIds: toggle(current.assigneeIds, id),
    }));
  const handleToggleDue = (due: BoardView["due"][number]) =>
    setView((current) => ({ ...current, due: toggle(current.due, due) }));
  const handleClearFilters = () => setView(DEFAULT_BOARD_VIEW);

  return {
    view,
    activeFilterCount: countActiveFilters(view),
    handleToggleMine,
    handleTogglePriority,
    handleToggleAssignee,
    handleToggleDue,
    handleClearFilters,
  };
}
