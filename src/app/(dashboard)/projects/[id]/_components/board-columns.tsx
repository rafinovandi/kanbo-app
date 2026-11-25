"use client";

import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  MeasuringStrategy,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { reorderCategoriesAction } from "@/actions/category-action";
import { deleteTaskAction, moveTaskAction } from "@/actions/task-action";
import TaskCardFace from "@/components/common/task-card-face";
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

const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

const isColumnDrag = (data: { current?: Record<string, unknown> }) =>
  data.current?.type === "column";

// Dragging a column only considers the other columns; dragging a card keeps using the nearest corners.
const collisionDetection: CollisionDetection = (args) =>
  isColumnDrag(args.active.data)
    ? closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === "column",
        ),
      })
    : closestCorners(args);

const findColumnId = (columns: BoardColumns, id: string) =>
  id in columns
    ? id
    : Object.keys(columns).find((columnId) =>
        columns[columnId].some((task) => task.id === id),
      );

// The columns with drag and drop (@dnd-kit). While a card is dragged the arrangement lives in `drag`
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const categoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories],
  );
  const isColumnDragging = activeId !== null && categoryIds.includes(activeId);

  const columns =
    drag && drag.base === serverColumns ? drag.columns : serverColumns;
  const activeTask = activeId
    ? Object.values(columns)
        .flat()
        .find((task) => task.id === activeId)
    : undefined;
  const activeCategory = activeTask
    ? categories.find((category) => category.id === activeTask.categoryId)
    : undefined;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    if (isColumnDrag(active.data)) return;
    setDrag({ base: serverColumns, columns: serverColumns });
  };

  // Crossing into another column moves the card there right away, so the column opens a gap for it.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    if (isColumnDrag(active.data)) return;
    const taskId = String(active.id);
    const overId = String(over.id);
    const from = findColumnId(columns, taskId);
    const to = findColumnId(columns, overId);
    if (!from || !to || from === to) return;

    const overIndex =
      overId in columns
        ? columns[to].length
        : columns[to].findIndex((task) => task.id === overId);
    const moved = moveTaskInColumns(columns, taskId, to, overIndex);
    if (moved) setDrag({ base: serverColumns, columns: moved.columns });
  };

  const labelOf = (id: string | number) => {
    const key = String(id);
    const category = categories.find((item) => item.id === key);
    if (category) return `${category.name} column`;
    const task = tasks.find((item) => item.id === key);
    return task ? `Task ${task.title}` : "Item";
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} is over ${labelOf(over.id)}.`
        : `${labelOf(active.id)} is no longer over a drop area.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} was dropped over ${labelOf(over.id)}.`
        : `${labelOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${labelOf(active.id)} was cancelled.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (isColumnDrag(active.data)) {
      const from = categoryIds.indexOf(String(active.id));
      const to = over ? categoryIds.indexOf(String(over.id)) : -1;
      if (from !== -1 && to !== -1 && from !== to)
        persistColumnOrder(arrayMove(categoryIds, from, to));
      return;
    }
    const taskId = String(active.id);
    const to = over ? findColumnId(columns, String(over.id)) : undefined;
    if (!over || !to) return setDrag(null);

    const overId = String(over.id);
    const overIndex =
      overId in columns
        ? columns[to].length
        : columns[to].findIndex((task) => task.id === overId);
    const moved = moveTaskInColumns(columns, taskId, to, overIndex);
    if (!moved) return setDrag(null);

    const originalColumn = findColumnId(serverColumns, taskId);
    const originalIndex = originalColumn
      ? serverColumns[originalColumn].findIndex((task) => task.id === taskId)
      : -1;
    const newIndex = moved.columns[to].findIndex((task) => task.id === taskId);
    if (originalColumn === to && originalIndex === newIndex)
      return setDrag(null);

    setDrag({ base: serverColumns, columns: moved.columns });
    persistMove(taskId, to, moved.position);
  };

  return (
    <DndContext
      id="board-dnd"
      sensors={sensors}
      measuring={measuring}
      accessibility={{ announcements }}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDrag(null);
      }}
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
        <SortableContext
          items={categoryIds}
          strategy={horizontalListSortingStrategy}
        >
          {categories.map((category) => (
            <BoardColumn
              key={category.id}
              project={project}
              category={category}
              categories={categories}
              tasks={columns[category.id] ?? []}
              canDrag={canDrag}
              isAdmin={isAdmin}
              filtered={countActiveFilters(view) > 0}
              onMove={moveToCategory}
              onDelete={deleteTask}
            />
          ))}
        </SortableContext>
        <BoardOverview projectId={projectId} />
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCardFace
            task={activeTask}
            done={activeCategory?.key === "done"}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
