"use client";

import { useDraggable } from "@dnd-kit/core";

import GanttBar from "@/components/common/gantt-bar";
import { GANTT_LIST_WIDTH, GANTT_ROW_HEIGHT } from "@/constants/gantt-constant";
import { formatRange, type GanttTimeline } from "@/lib/gantt";
import { cn } from "@/lib/utils";
import type { GanttGroup, GanttItem } from "@/types/gantt";

// One item of the Gantt timeline: its sticky name cell, which drags up and down onto another group, and its bar.
export default function GanttRow({
  ghost = false,
  item,
  group,
  timeline,
  today,
  scrollRef,
  resizeCandidate,
  canMove,
  canResize,
  onOpen,
  onResize,
  onChangeDue,
  onEdgeScroll,
}: {
  ghost?: boolean;
  item: GanttItem;
  group: GanttGroup;
  timeline: GanttTimeline;
  today: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  resizeCandidate: string | null;
  canMove: boolean;
  canResize: boolean;
  onOpen: (itemId: string) => void;
  onResize: (candidate: string | null) => void;
  onChangeDue?: (itemId: string, due: string | null) => void;
  onEdgeScroll: (clientX: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({
      id: ghost ? `${item.id}-ghost` : item.id,
      data: { groupId: group.id },
      disabled: ghost || !canMove,
    });
  // Mouse and touch drag the whole name cell; the keyboard picks a row up from its icon.
  const { onKeyDown: onDragKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <div
      className={cn(
        "group/row flex",
        ghost && "pointer-events-none opacity-40",
      )}
      style={{ height: GANTT_ROW_HEIGHT }}
    >
      <div
        ref={setNodeRef}
        {...pointerListeners}
        className={cn(
          "sticky left-0 z-20 flex shrink-0 touch-pan-y items-center gap-2 border-r bg-card px-2 sm:gap-3 sm:px-4",
          canMove && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-40",
        )}
        style={{ width: GANTT_LIST_WIDTH }}
      >
        {canMove ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            onKeyDown={
              onDragKeyDown as
                | React.KeyboardEventHandler<HTMLButtonElement>
                | undefined
            }
            aria-label={`Move ${item.title} to another category`}
            className="shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {group.icon}
          </button>
        ) : (
          group.icon
        )}
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          aria-label={`Open task ${item.title}`}
          className="flex min-w-0 flex-1 flex-col rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            className={cn(
              "line-clamp-2 text-[13px] leading-tight font-medium sm:line-clamp-1 sm:text-sm sm:leading-normal",
              item.done && "text-muted-foreground line-through",
            )}
          >
            {item.title}
          </span>
          <span className="hidden truncate text-xs text-muted-foreground sm:block">
            {formatRange(item.created, item.due)}
          </span>
        </button>
      </div>

      <GanttBar
        item={item}
        group={group}
        timeline={timeline}
        today={today}
        scrollRef={scrollRef}
        resizeCandidate={resizeCandidate}
        canResize={canResize}
        dragProps={canMove ? pointerListeners : undefined}
        onOpen={onOpen}
        onResize={onResize}
        onChangeDue={onChangeDue}
        onEdgeScroll={onEdgeScroll}
      />
    </div>
  );
}
