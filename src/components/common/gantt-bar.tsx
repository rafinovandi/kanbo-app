"use client";

import { useRef } from "react";

import UserAvatar from "@/components/common/user-avatar";
import { AvatarGroup } from "@/components/ui/avatar";
import {
  GANTT_BAR_TONE,
  GANTT_DAY_WIDTH,
  GANTT_INSIDE_MIN_DAYS,
} from "@/constants/gantt-constant";
import { PROJECT_TONE } from "@/constants/profile-constant";
import {
  dayFromIndex,
  dayIndex,
  diffDays,
  formatDay,
  formatRange,
  getSpan,
  resolveDueDate,
  stepDueDate,
  type GanttTimeline,
} from "@/lib/gantt";
import { cn } from "@/lib/utils";
import type { GanttGroup, GanttItem } from "@/types/gantt";

const MAX_AVATARS = 2;

// One item's lane: the bar (click to open, drag up or down to move the task to another category via `dragProps`), its title beside it when the bar is short, and a handle on its right
// end that drags or arrow-keys the due day. The start of the bar never moves.
export default function GanttBar({
  item,
  group,
  timeline,
  today,
  scrollRef,
  resizeCandidate,
  canResize,
  dragProps,
  onOpen,
  onResize,
  onChangeDue,
  onEdgeScroll,
}: {
  item: GanttItem;
  group: GanttGroup;
  timeline: GanttTimeline;
  today: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  resizeCandidate: string | null;
  canResize: boolean;
  dragProps?: Record<string, unknown>;
  onOpen: (itemId: string) => void;
  onResize: (candidate: string | null) => void;
  onChangeDue?: (itemId: string, due: string | null) => void;
  onEdgeScroll: (clientX: number) => void;
}) {
  const gesture = useRef<{
    startX: number;
    startScroll: number;
    startOffset: number;
    startEnd: string;
  } | null>(null);
  const firstIndex = dayIndex(timeline.start);

  const span = getSpan(item.created, item.due);
  const savedDue = span.hasDue ? item.due : null;
  const preview =
    resizeCandidate === null
      ? undefined
      : resolveDueDate({
          created: item.created,
          today,
          candidate: resizeCandidate,
        });
  const hasDue = preview === undefined ? span.hasDue : preview !== null;
  const end = preview === undefined ? span.end : (preview ?? span.start);
  const startOffset = dayIndex(span.start) - firstIndex;
  const days = diffDays(span.start, end) + 1;
  const left = startOffset * GANTT_DAY_WIDTH + 4;
  const width = days * GANTT_DAY_WIDTH - 8;
  const inside = days >= GANTT_INSIDE_MIN_DAYS;
  const range = formatRange(item.created, item.due);
  const resizing = resizeCandidate !== null;

  const candidateAt = (clientX: number) => {
    const state = gesture.current;
    if (!state) return null;
    const scrolled = (scrollRef.current?.scrollLeft ?? 0) - state.startScroll;
    const moved = Math.round(
      (clientX - state.startX + scrolled) / GANTT_DAY_WIDTH,
    );
    const offset = Math.min(
      Math.max(state.startOffset + moved, startOffset),
      timeline.days.length - 1,
    );
    return dayFromIndex(firstIndex + offset);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      startX: event.clientX,
      startScroll: scrollRef.current?.scrollLeft ?? 0,
      startOffset: startOffset + days - 1,
      startEnd: end,
    };
    onResize(end);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!gesture.current) return;
    onEdgeScroll(event.clientX);
    onResize(candidateAt(event.clientX));
  };
  const finishResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    save: boolean,
  ) => {
    const state = gesture.current;
    if (!state) return;
    const candidate = candidateAt(event.clientX);
    gesture.current = null;
    onResize(null);
    if (!save || !candidate || candidate === state.startEnd) return;
    const next = resolveDueDate({ created: item.created, today, candidate });
    if (next !== savedDue) onChangeDue?.(item.id, next);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = stepDueDate({
      created: item.created,
      today,
      current: savedDue,
      direction: event.key === "ArrowRight" ? 1 : -1,
    });
    if (next !== savedDue) onChangeDue?.(item.id, next);
  };

  return (
    <div
      className="relative shrink-0"
      style={{ width: timeline.days.length * GANTT_DAY_WIDTH }}
    >
      <button
        type="button"
        {...dragProps}
        onClick={() => onOpen(item.id)}
        title={`${item.title} (${range})`}
        aria-label={`Open task ${item.title}, ${range}`}
        className={cn(
          "absolute top-2 flex h-9 items-center gap-2 overflow-hidden rounded-lg border text-[13px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          GANTT_BAR_TONE[group.color],
          !hasDue && "border-dashed",
          inside ? "px-3" : "justify-center",
        )}
        style={{ left, width }}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            PROJECT_TONE[group.color].dot,
          )}
        />
        {inside && (
          <>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left",
                item.done && "line-through",
              )}
            >
              {item.title}
            </span>
            {!!item.avatars?.length && (
              <AvatarGroup>
                {item.avatars.slice(0, MAX_AVATARS).map((person) => (
                  <UserAvatar
                    key={person.id}
                    name={person.name}
                    avatarUrl={person.avatarUrl}
                    avatarBg={person.avatarBg}
                    avatarFg={person.avatarFg}
                    size="sm"
                  />
                ))}
              </AvatarGroup>
            )}
          </>
        )}
      </button>

      {!inside && !resizing && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          {...dragProps}
          onClick={() => onOpen(item.id)}
          className={cn(
            "absolute top-0 flex h-full items-center text-[13px] font-medium whitespace-nowrap",
            item.done && "line-through",
          )}
          style={{ left: left + width + 10 }}
        >
          {item.title}
        </button>
      )}

      {canResize && (
        <button
          type="button"
          aria-label={`Change due date of ${item.title}. Use the left and right arrow keys.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => finishResize(event, true)}
          onPointerCancel={(event) => finishResize(event, false)}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute top-2 z-10 flex h-9 w-3 cursor-ew-resize touch-none items-center justify-center rounded-r-lg opacity-0 pointer-coarse:w-5 pointer-coarse:-translate-x-2 outline-none group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:opacity-100",
            resizing && "opacity-100",
          )}
          style={{ left: left + width - 12 }}
        >
          <span
            aria-hidden
            className="h-4 w-0.5 rounded-full bg-current opacity-50"
          />
        </button>
      )}

      {resizing && (
        <span
          className="pointer-events-none absolute top-1 z-10 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background"
          style={{ left: left + width + 8 }}
        >
          {preview ? `Due ${formatDay(preview)}` : "No due date"}
        </span>
      )}
    </div>
  );
}
