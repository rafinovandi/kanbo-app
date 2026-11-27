"use client";

import {
  Accessibility,
  defaultPreset,
  Feedback,
  PointerActivationConstraints,
} from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { reorderCategoriesAction } from "@/actions/category-action";
import { deleteTaskAction, moveTaskAction } from "@/actions/task-action";
import { boardKey } from "@/hooks/use-board";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import useBoardMutation from "@/hooks/use-board-mutation";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import { cn } from "@/lib/utils";
import {
  applyBoardView,
  countActiveFilters,
  groupTasksByCategory,
  moveTaskInColumns,
} from "@/lib/board";
import type {
  BoardCategory,
  BoardColumns,
  BoardData,
  BoardTask,
  BoardView,
} from "@/types/board";

import BoardColumn from "./board-column";
import BoardOverview from "./board-overview";

const sensors = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 8 })]
        : [new PointerActivationConstraints.Distance({ value: 8 })],
  }),
  KeyboardSensor,
];

const findColumnId = (columns: BoardColumns, id: string) =>
  id in columns
    ? id
    : Object.keys(columns).find((columnId) =>
        columns[columnId].some((task) => task.id === id),
      );

// The columns with drag and drop (@dnd-kit/react). While a card is dragged the arrangement lives in `drag`
// (valid only for the data it was made from); a drop saves optimistically and rolls back on error.
export default function BoardColumns({
  project,
  categories,
  tasks,
  canDrag,
  isAdmin,
  view,
  meId,
  today,
}: {
  project: BoardData["project"];
  categories: BoardCategory[];
  tasks: BoardTask[];
  canDrag: boolean;
  isAdmin: boolean;
  view: BoardView;
  meId: string;
  today: string;
}) {
  const queryClient = useQueryClient();
  const projectId = project.id;
  const mutateBoard = useBoardMutation(projectId);
  const serverColumns = useMemo(() => {
    const doneIds = new Set(
      categories
        .filter((category) => category.key === "done")
        .map((category) => category.id),
    );
    return groupTasksByCategory(
      categories,
      applyBoardView(tasks, view, { meId, today, doneIds }),
    );
  }, [categories, tasks, view, meId, today]);
  const [drag, setDrag] = useState<{
    base: BoardColumns;
    columns: BoardColumns;
  } | null>(null);
  const [columnDrag, setColumnDrag] = useState<{
    base: BoardCategory[];
    order: BoardCategory[];
  } | null>(null);

  const filtered = countActiveFilters(view) > 0;
  const columns =
    drag && drag.base === serverColumns ? drag.columns : serverColumns;
  const orderedCategories =
    columnDrag && columnDrag.base === categories
      ? columnDrag.order
      : categories;
  const isColumnDragging = columnDrag !== null;

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
  };

  const persistMove = (taskId: string, categoryId: string, position: number) =>
    mutateBoard(
      (data) => ({
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === taskId ? { ...task, categoryId, position } : task,
        ),
      }),
      () => moveTaskAction(taskId, categoryId, position),
    );

  const moveToCategory = (taskId: string, categoryId: string) => {
    const from = findColumnId(serverColumns, taskId);
    const moved = moveTaskInColumns(
      serverColumns,
      taskId,
      categoryId,
      serverColumns[categoryId]?.length ?? 0,
    );
    if (from !== categoryId && moved)
      persistMove(taskId, categoryId, moved.position);
  };

  const deleteTask = async (taskId: string) => {
    const result = await deleteTaskAction(taskId);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Task deleted");
    queryClient.invalidateQueries({ queryKey: boardKey(projectId) });
    refreshStats();
    return true;
  };

  const persistColumnOrder = (order: string[]) =>
    mutateBoard(
      (data) => ({
        ...data,
        categories: order
          .map((id) => data.categories.find((c) => c.id === id))
          .filter((c) => !!c),
      }),
      () => reorderCategoriesAction(projectId, order),
    );

  const onDragStart = ({ operation: { source } }: DragStartEvent) => {
    if (source?.type === "column")
      setColumnDrag({ base: categories, order: categories });
    else if (source) setDrag({ base: serverColumns, columns: serverColumns });
  };

  // Every reorder goes through React state while dragging (cards across columns, columns sideways);
  // the sortables then animate from their old spot to the new one.
  const onDragOver = (event: DragOverEvent) => {
    const type = event.operation.source?.type;
    if (type === "column")
      setColumnDrag((current) =>
        current && current.base === categories
          ? { base: current.base, order: move(current.order, event) }
          : current,
      );
    else if (type === "item")
      setDrag((current) =>
        current && current.base === serverColumns
          ? { base: current.base, columns: move(current.columns, event) }
          : current,
      );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { source } = event.operation;
    if (event.canceled || !source) {
      setDrag(null);
      setColumnDrag(null);
      return;
    }

    if (source.type === "column") {
      const order = orderedCategories.map((category) => category.id);
      setColumnDrag(null);
      if (order.some((id, index) => id !== categories[index]?.id))
        persistColumnOrder(order);
      return;
    }

    const taskId = String(source.id);
    const to = findColumnId(columns, taskId);
    const from = findColumnId(serverColumns, taskId);
    const toIndex = to
      ? columns[to].findIndex((task) => task.id === taskId)
      : -1;
    const moved = to
      ? moveTaskInColumns(serverColumns, taskId, to, toIndex)
      : null;
    const originalIndex = from
      ? serverColumns[from].findIndex((task) => task.id === taskId)
      : -1;
    if (!to || !moved || (from === to && originalIndex === toIndex))
      return setDrag(null);

    setDrag({ base: serverColumns, columns: moved.columns });
    persistMove(taskId, to, moved.position);
  };

  // Kept stable across the re-renders a drag causes, so the provider doesn't reconfigure plugins mid-drag.
  const plugins = useMemo(() => {
    const labelOf = (id: string | number) => {
      const key = String(id);
      const category = categories.find((item) => item.id === key);
      if (category) return `${category.name} column`;
      const task = tasks.find((item) => item.id === key);
      return task ? `Task ${task.title}` : "Item";
    };
    const accessibility = Accessibility.configure({
      announcements: {
        dragstart: ({ operation: { source } }: DragStartEvent) =>
          source ? `Picked up ${labelOf(source.id)}.` : undefined,
        dragover: ({ operation: { source, target } }: DragOverEvent) => {
          if (!source) return;
          return target && target.id !== source.id
            ? `${labelOf(source.id)} is over ${labelOf(target.id)}.`
            : undefined;
        },
        dragend: ({
          operation: { source, target },
          canceled,
        }: DragEndEvent) => {
          if (!source) return;
          if (canceled) return `Moving ${labelOf(source.id)} was cancelled.`;
          return target
            ? `${labelOf(source.id)} was dropped over ${labelOf(target.id)}.`
            : `${labelOf(source.id)} was dropped.`;
        },
      },
    });
    return [
      ...defaultPreset.plugins,
      accessibility,
      Feedback.configure({ dropAnimation: null }),
    ];
  }, [categories, tasks]);

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={plugins}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div
        role="region"
        aria-label="Board columns"
        tabIndex={0}
        className={cn(
          "-mr-4 flex items-start gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain pr-4 pb-3 sm:-mr-7 sm:pr-7",
          !isColumnDragging && "pointer-coarse:snap-x pointer-coarse:snap-proximity",
        )}
      >
        {orderedCategories.map((category, index) => (
          <BoardColumn
            key={category.id}
            index={index}
            project={project}
            category={category}
            categories={categories}
            tasks={columns[category.id] ?? []}
            canDrag={canDrag}
            isAdmin={isAdmin}
            filtered={filtered}
            onMove={moveToCategory}
            onDelete={deleteTask}
          />
        ))}
        <BoardOverview projectId={projectId} />
      </div>
    </DragDropProvider>
  );
}
