"use client";

import { InfoCircle } from "iconsax-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import GanttLegendRow from "./gantt-legend-row";

// "How to read the timeline" popover next to the Gantt filters.
export default function GanttLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="How to read the timeline"
          title="How to read the timeline"
        >
          <InfoCircle
            size={18}
            variant="Linear"
            color="currentColor"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-0 p-1.5">
        <p className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
          How to read the timeline
        </p>
        <GanttLegendRow
          sample={
            <span className="inline-flex h-5 w-11 items-center gap-1.5 rounded-md border border-kb-placeholder/50 bg-kb-gray-tint px-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="h-0.75 flex-1 rounded-full bg-kb-placeholder/30" />
            </span>
          }
          title="With a due date"
          text="The bar runs from the day the task was created to its due date."
        />
        <GanttLegendRow
          sample={
            <span className="inline-flex size-5 items-center justify-center rounded-md border border-dashed border-kb-gray bg-kb-gray-tint">
              <span className="size-1.5 rounded-full bg-muted-foreground" />
            </span>
          }
          title="No due date"
          text="A one-day block on the day it was created."
        />
        <div role="separator" className="mx-2.5 my-1 h-px bg-border" />
        <p className="px-2.5 pt-1 pb-1.5 text-xs leading-snug text-muted-foreground">
          Bar colors follow the task&apos;s category. Click a bar to open the
          task.
        </p>
      </PopoverContent>
    </Popover>
  );
}
