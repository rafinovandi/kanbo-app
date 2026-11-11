"use client";

import * as React from "react";
import { cn } from "cn";
import { Progress as ProgressPrimitive } from "radix-ui";

function Progress({
  className,
  indicatorClassName,
  segments,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  segments?: { id: string; value: number; className?: string }[];
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        segments && "gap-[2px]",
        className,
      )}
      {...props}
    >
      {segments ? (
        segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div
              key={segment.id}
              data-slot="progress-segment"
              className={cn(
                "h-full min-w-0 rounded-[2px] transition-all",
                segment.className,
              )}
              style={{ flex: `${segment.value} 1 0%` }}
            />
          ))
      ) : (
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "size-full flex-1 rounded-full bg-kb-blue transition-all",
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
}

export { Progress };
