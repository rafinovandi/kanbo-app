"use client";

import {
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Add } from "iconsax-react";
import { useState } from "react";

import GripIcon from "@/components/common/grip-icon";
import { Button } from "@/components/ui/button";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { cn } from "@/lib/utils";
import type { BoardCategory, BoardData, BoardTask } from "@/types/board";

import TaskDialog from "@/components/common/task-dialog";
import BoardCard from "./board-card";
import BoardColumnMenu from "./board-column-menu";
import CategoryDialog from "./category-dialog";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

// One column: header with color bar, name, count and a hover + button, then its cards and
// an "Add New" card. The card list is the drop target, so empty columns accept drops too.
export default function BoardColumn({
  project,
  category,
  categories,
  tasks,
  canDrag,
  isAdmin,
  filtered,
  onMove,
  onDelete,
}: {
  project: BoardData["project"];
  category: BoardCategory;
  categories: BoardCategory[];
  tasks: BoardTask[];
  canDrag: boolean;
  isAdmin: boolean;
  filtered: boolean;
  onMove: (taskId: string, categoryId: string) => void;
  onDelete: (taskId: string) => Promise<boolean>;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: category.id,
    data: { type: "column" },
    disabled: { draggable: !isAdmin },
    animateLayoutChanges,
  });
  const [editOpen, setEditOpen] = useState(false);

  return (
    <section
      ref={setNodeRef}
      aria-label={category.name}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/column flex w-[300px] flex-none snap-start flex-col gap-2.5 rounded-[20px] bg-kb-surface p-2.5",
        isDragging && "relative z-10 opacity-40",
      )}
    >
      <div className="flex min-h-8 items-center gap-2 pl-1.5">
        <span
          className={cn("h-4 w-1 rounded-sm", PROJECT_TONE[category.color].bar)}
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold whitespace-nowrap">
          {category.name}
        </h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-border px-1.5 text-xs font-semibold text-muted-foreground">
          {tasks.length}
        </span>
        <div className="ml-auto flex items-center">
          <TaskDialog
            project={project}
            category={category}
            categories={categories}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Add task to ${category.name}`}
              className="opacity-0 max-md:opacity-100 group-hover/column:opacity-100 focus-visible:opacity-100"
            >
              <Add
                size={20}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
            </Button>
          </TaskDialog>
          {isAdmin && (
            <BoardColumnMenu
              projectId={project.id}
              category={category}
              categories={categories}
              taskCount={tasks.length}
              onEdit={() => setEditOpen(true)}
            />
          )}
          {isAdmin && (
            <Button
              ref={setActivatorNodeRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${category.name} column`}
              className="cursor-grab touch-none opacity-0 max-md:opacity-100 group-hover/column:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripIcon />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-12 flex-col gap-2.5 rounded-2xl",
          isOver && tasks.length === 0 && "bg-kb-gray-tint",
        )}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <BoardCard
              key={task.id}
              project={project}
              task={task}
              category={category}
              categories={categories}
              canDrag={canDrag}
              isAdmin={isAdmin}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-kb-line px-4 py-6 text-center text-[13px] text-muted-foreground">
            {filtered ? "No tasks match" : "No tasks here yet"}
          </div>
        )}
      </div>

      <TaskDialog project={project} category={category} categories={categories}>
        <button
          type="button"
          className="flex min-h-[54px] items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-kb-line text-sm font-medium text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Add size={18} variant="Linear" color="currentColor" aria-hidden />
          Add New
        </button>
      </TaskDialog>
      {isAdmin && (
        <CategoryDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          projectId={project.id}
          categories={categories}
          category={category}
          taskCount={tasks.length}
        />
      )}
    </section>
  );
}
