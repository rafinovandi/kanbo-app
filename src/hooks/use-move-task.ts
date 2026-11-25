import { useQueryClient } from "@tanstack/react-query";

import { moveTaskAction } from "@/actions/task-action";
import { boardKey } from "@/hooks/use-board";
import useBoardMutation from "@/hooks/use-board-mutation";

// Moves a task to another column, optimistically. With a position it lands between its neighbours; without one it
// goes to the bottom of the column and the board is reloaded afterwards to pick up the saved position.
export default function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const mutateBoard = useBoardMutation(projectId);

  return async (taskId: string, categoryId: string, position?: number) => {
    const saved = await mutateBoard(
      (data) => {
        const last = data.tasks
          .filter(
            (task) => task.categoryId === categoryId && task.id !== taskId,
          )
          .reduce(
            (max, task) => Math.max(max, task.position),
            Number.NEGATIVE_INFINITY,
          );
        const next = position ?? (Number.isFinite(last) ? last + 1 : 1);
        return {
          ...data,
          tasks: data.tasks.map((task) =>
            task.id === taskId ? { ...task, categoryId, position: next } : task,
          ),
        };
      },
      () => moveTaskAction(taskId, categoryId, position),
    );
    if (saved && position === undefined)
      queryClient.invalidateQueries({ queryKey: boardKey(projectId) });
    return saved;
  };
}
