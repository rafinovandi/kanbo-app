"use client";

import TaskDialog from "@/components/common/task-dialog";
import useBoard from "@/hooks/use-board";

// Opens the task modal for a task of a project whose board is not on screen (My Tasks): the board is loaded
// when the dialog opens, since the modal needs the columns and the assignees of the task.
export default function TaskDialogLoader({
  projectId,
  taskId,
  onOpenChange,
}: {
  projectId: string;
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data } = useBoard(projectId, "", taskId !== null);
  const task = data?.tasks.find((item) => item.id === taskId);
  if (!data || !task) return null;

  return (
    <TaskDialog project={data.project} categories={data.categories} task={task} open onOpenChange={onOpenChange} />
  );
}
