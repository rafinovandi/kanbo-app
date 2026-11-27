"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useState } from "react";

import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import TaskCardFace from "@/components/common/task-card-face";
import { BOARD_SORTABLE_PLUGINS } from "@/constants/dnd-constant";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { BoardCategory, BoardData, BoardTask } from "@/types/board";

import BoardCardMenu from "./board-card-menu";
import TaskDialog from "@/components/common/task-dialog";

export default function BoardCard({
  index,
  project,
  task,
  category,
  categories,
  canDrag,
  isAdmin,
  onMove,
  onDelete,
}: {
  index: number;
  project: BoardData["project"];
  task: BoardTask;
  category: BoardCategory;
  categories: BoardCategory[];
  canDrag: boolean;
  isAdmin: boolean;
  onMove: (taskId: string, categoryId: string) => void;
  onDelete: (taskId: string) => Promise<boolean>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const meId = useAuthStore((state) => state.profile.id);
  const canDelete = isAdmin || (!!task.createdBy && task.createdBy === meId);
  const { ref } = useSortable({
    id: task.id,
    index,
    group: category.id,
    type: "item",
    accept: "item",
    disabled: { draggable: !canDrag },
    plugins: BOARD_SORTABLE_PLUGINS,
  });

  const shortTitle =
    task.title.length > 60 ? `${task.title.slice(0, 60)}…` : task.title;

  return (
    <>
      <div
        ref={ref}
        onClick={() => setDetailOpen(true)}
        className={cn(
          "touch-manipulation rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          canDrag && "cursor-grab",
        )}
      >
        <TaskCardFace
          task={task}
          done={category.key === "done"}
          menu={
            <BoardCardMenu
              categories={categories}
              categoryId={category.id}
              canDelete={canDelete}
              onMove={(categoryId) => onMove(task.id, categoryId)}
              onRequestDelete={() => setConfirmOpen(true)}
            />
          }
        />
      </div>
      <TaskDialog
        project={project}
        categories={categories}
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete task?"
        description={`"${shortTitle}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete Task"
        onConfirm={() => onDelete(task.id)}
      />
    </>
  );
}
