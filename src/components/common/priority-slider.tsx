"use client";

import { Flag } from "iconsax-react";
import { Slider as SliderPrimitive } from "radix-ui";

import { PRIORITY_LEVELS } from "@/constants/priority-constant";
import { TASK_PRIORITY_CHIP } from "@/constants/my-tasks-constant";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";

const THUMB = 30;
const LAST = PRIORITY_LEVELS.length - 1;
const at = (index: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${index / LAST})`;

const ADVANCE = "transition-[left,width] duration-200 ease-out";

// Three-stop priority slider (Low, Medium, High) used by Add Task and, later, the task modal. Drag or click the track,
// or use the arrow keys; Enter calls `onEnter` (a popover closes itself with it).
export default function PrioritySlider({
  value,
  onValueChange,
  onEnter,
  disabled,
}: {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  onEnter?: () => void;
  disabled?: boolean;
}) {
  const index = Math.max(
    0,
    PRIORITY_LEVELS.findIndex((level) => level.value === value),
  );
  const level = PRIORITY_LEVELS[index];
  const label = TASK_PRIORITY_CHIP[level.value].label;
  const isHigh = index === LAST;
  const captionShift = index === 0 ? "-18px" : index === LAST ? "calc(-100% + 18px)" : "-50%";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-muted-foreground">Priority</span>
        <span className="font-semibold">{label}</span>
      </div>
      <div className="flex justify-between text-[13px] text-muted-foreground">
        <span>{TASK_PRIORITY_CHIP[PRIORITY_LEVELS[0].value].label}</span>
        <span>{TASK_PRIORITY_CHIP[PRIORITY_LEVELS[LAST].value].label}</span>
      </div>

      <SliderPrimitive.Root
        min={0}
        max={LAST}
        step={1}
        value={[index]}
        disabled={disabled}
        onValueChange={([next]) => onValueChange(PRIORITY_LEVELS[next].value)}
        onKeyDown={(event) => event.key === "Enter" && onEnter?.()}
        className="relative flex h-8 w-full touch-none items-center select-none data-disabled:opacity-50 [&>span[style*='left']]:transition-[left] [&>span[style*='left']]:duration-200"
      >
        <SliderPrimitive.Track className="relative h-full w-full grow overflow-hidden rounded-[10px] bg-muted">
          <span
            aria-hidden="true"
            style={{ width: at(index) }}
            className={cn("absolute inset-y-0 left-0 rounded-[10px] bg-linear-to-r", ADVANCE, level.fill)}
          />
          {isHigh && (
            <span
              aria-hidden="true"
              style={{ width: at(index) }}
              className={cn("absolute inset-y-0 left-0 bg-[url('/priority-pixels.svg')] bg-repeat-x", ADVANCE)}
            />
          )}
          {PRIORITY_LEVELS.map((stop, stopIndex) => (
            <span
              key={stop.value}
              aria-hidden="true"
              style={{ left: at(stopIndex) }}
              className={cn(
                "absolute top-1/2 size-[5px] -translate-1/2 rounded-full",
                stopIndex < index ? level.dot : "bg-kb-placeholder",
                stopIndex === index && "opacity-0",
              )}
            />
          ))}
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb
          aria-label="Priority"
          aria-valuetext={label}
          className={cn(
            "flex size-[30px] items-center justify-center rounded-full border-2 outline-none transition-[background-color,border-color,box-shadow] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
            level.thumb,
          )}
        >
          <Flag size={16} variant="Linear" color="currentColor" aria-hidden />
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>

      <div className="relative h-[18px] text-[13px] text-muted-foreground">
        <span
          style={{ left: at(index), transform: `translateX(${captionShift})` }}
          className={cn("absolute top-0 whitespace-nowrap", ADVANCE)}
        >
          {level.caption}
        </span>
      </div>
    </div>
  );
}
