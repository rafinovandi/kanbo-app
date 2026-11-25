"use client";

import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import GanttDayBackground from "@/components/common/gantt-day-background";
import GanttGroupSection from "@/components/common/gantt-group-section";
import GanttRow from "@/components/common/gantt-row";
import GanttTimelineHeader from "@/components/common/gantt-timeline-header";
import { GANTT_DAY_WIDTH, GANTT_LIST_WIDTH } from "@/constants/gantt-constant";
import { buildTimeline, dayIndex, getSpan } from "@/lib/gantt";
import type { GanttGroup } from "@/types/gantt";

const EDGE_SCROLL_ZONE = 48;
const EDGE_SCROLL_STEP = 16;

// A row only moves up and down: the dates never change by dragging a row.
// The name column's current width in px (it changes with the screen size).
const readListWidth = (element: HTMLElement) =>
  Number.parseFloat(
    getComputedStyle(element).getPropertyValue("--gantt-list"),
  ) || 0;

const lockVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

// Day-by-day timeline of grouped items in a card, with an optional `toolbar` above it. A row drags up or down onto
// another group (`onMoveItem`); the right end of a bar drags the due day (`onChangeDue`, null when it goes back to
// the created day). While a row is dragged, the target group shows a faded copy of it right under its header as the drop preview, and
// groups without items appear as drop targets.
export default function GanttChart({
  groups,
  today,
  toolbar,
  emptyMessage,
  onOpen,
  onMoveItem,
  onChangeDue,
}: {
  groups: GanttGroup[];
  today: string;
  toolbar?: ReactNode;
  emptyMessage: ReactNode;
  onOpen: (itemId: string) => void;
  onMoveItem?: (itemId: string, groupId: string) => void;
  onChangeDue?: (itemId: string, due: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const justDropped = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  const [resize, setResize] = useState<{
    id: string;
    candidate: string;
  } | null>(null);

  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const timeline = useMemo(
    () =>
      buildTimeline(
        items.map((item) => getSpan(item.created, item.due)),
        today,
      ),
    [items, today],
  );
  const timelineWidth = timeline.days.length * GANTT_DAY_WIDTH;
  const dragging = activeId !== null;
  const visibleGroups = groups.filter(
    (group) => group.items.length > 0 || dragging,
  );
  const activeItem = items.find((item) => item.id === activeId);
  const activeGroup = groups.find((group) =>
    group.items.some((item) => item.id === activeId),
  );

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    // Open on the earliest task that is still running or ahead, scrolled further only as far as needed to keep today in view.
    const spans = items.map((item) => getSpan(item.created, item.due));
    const current = spans.filter((span) => span.end >= today);
    const starts = (current.length ? current : spans).map((span) => span.start);
    const anchor = starts.length
      ? starts.reduce((a, b) => (a < b ? a : b))
      : today;
    const anchorLeft =
      (dayIndex(anchor) - dayIndex(timeline.start) - 2) * GANTT_DAY_WIDTH;
    const todayLeft =
      (dayIndex(today) - dayIndex(timeline.start)) * GANTT_DAY_WIDTH;
    const todayInView =
      todayLeft - (element.clientWidth - readListWidth(element)) * 0.4;
    element.scrollLeft = Math.max(0, anchorLeft, todayInView);
    // Only on the first paint; later changes keep the member's scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const titleOf = (id: string | number) =>
    items.find((item) => item.id === id)?.title ?? "Task";
  const groupName = (id: string | number) =>
    groups.find((group) => group.id === id)?.name ?? "this category";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over ${groupName(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} was dropped on ${groupName(over.id)}.`
        : `${titleOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  // A drop that ends over a task name would also click it; that click must not open the task.
  const handleOpen = (itemId: string) => {
    if (!justDropped.current) onOpen(itemId);
  };
  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id));
  const handleDragOver = (event: DragOverEvent) =>
    setOverGroupId(event.over ? String(event.over.id) : null);
  const stopDragging = () => {
    setActiveId(null);
    setOverGroupId(null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    stopDragging();
    justDropped.current = true;
    setTimeout(() => (justDropped.current = false), 0);
    const from = event.active.data.current?.groupId;
    const to = event.over ? String(event.over.id) : null;
    if (to && to !== from) onMoveItem?.(String(event.active.id), to);
  };

  const scrollNearEdge = (clientX: number) => {
    const element = scrollRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (clientX > rect.right - EDGE_SCROLL_ZONE)
      element.scrollLeft += EDGE_SCROLL_STEP;
    else if (clientX < rect.left + readListWidth(element) + EDGE_SCROLL_ZONE)
      element.scrollLeft -= EDGE_SCROLL_STEP;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      modifiers={[lockVertical]}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To pick up a task, press space. Use the up and down arrow keys to choose a category, then press space to drop it or escape to cancel.",
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={stopDragging}
    >
      <div className="overflow-hidden rounded-xl border bg-card [--gantt-list:144px] sm:[--gantt-list:300px]">
        {toolbar && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
            {toolbar}
          </div>
        )}
        <div
          ref={scrollRef}
          role="region"
          aria-label="Timeline"
          tabIndex={0}
          className="relative max-h-[70vh] overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <div
            className="relative"
            style={{
              width: `calc(${GANTT_LIST_WIDTH} + ${timelineWidth}px)`,
              minWidth: "100%",
            }}
          >
            <GanttDayBackground timeline={timeline} />
            <GanttTimelineHeader timeline={timeline} taskCount={items.length} />
            {items.length === 0 && !dragging ? (
              <div
                className="relative z-20 px-4 py-10 text-sm text-muted-foreground"
                style={{ width: GANTT_LIST_WIDTH }}
              >
                {emptyMessage}
              </div>
            ) : (
              <div>
                {visibleGroups.map((group) => (
                  <GanttGroupSection key={group.id} group={group}>
                    {activeItem &&
                      overGroupId === group.id &&
                      group.id !== activeGroup?.id && (
                        <GanttRow
                          ghost
                          item={activeItem}
                          group={group}
                          timeline={timeline}
                          today={today}
                          scrollRef={scrollRef}
                          resizeCandidate={null}
                          canMove={false}
                          canResize={false}
                          onOpen={handleOpen}
                          onResize={() => {}}
                          onEdgeScroll={scrollNearEdge}
                        />
                      )}
                    {group.items.map((item) => (
                      <GanttRow
                        key={item.id}
                        item={item}
                        group={group}
                        timeline={timeline}
                        today={today}
                        scrollRef={scrollRef}
                        resizeCandidate={
                          resize?.id === item.id ? resize.candidate : null
                        }
                        canMove={!!onMoveItem}
                        canResize={!!onChangeDue}
                        onOpen={handleOpen}
                        onResize={(candidate) =>
                          setResize(
                            candidate ? { id: item.id, candidate } : null,
                          )
                        }
                        onChangeDue={onChangeDue}
                        onEdgeScroll={scrollNearEdge}
                      />
                    ))}
                  </GanttGroupSection>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
