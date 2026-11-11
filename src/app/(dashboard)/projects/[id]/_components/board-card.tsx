"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import TaskCardFace from "@/components/common/task-card-face";
import { cn } from "@/lib/utils";
import type { BoardCategory, BoardData, BoardTask } from "@/types/board";

import BoardCardMenu from "./board-card-menu";
import TaskDialog from "@/components/common/task-dialog";

export default function BoardCard({
  project,
  task,
  category,
  categories,
  canDrag,
  isAdmin,
  onMove,
  onDelete,
}: {
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canDrag,
  });

  const shortTitle =
    task.title.length > 60 ? `${task.title.slice(0, 60)}…` : task.title;

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        {...listeners}
        onClick={() => setDetailOpen(true)}
        className={cn(
          "touch-manipulation rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          canDrag && "cursor-grab",
          isDragging && "opacity-40",
        )}
      >
        <TaskCardFace
          task={task}
          done={category.key === "done"}
          menu={
            <BoardCardMenu
              categories={categories}
              categoryId={category.id}
              isAdmin={isAdmin}
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
