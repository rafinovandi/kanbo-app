import { GANTT_DAY_WIDTH, GANTT_LIST_WIDTH } from "@/constants/gantt-constant";
import type { GanttTimeline } from "@/lib/gantt";
import { cn } from "@/lib/utils";

// Weekend shading and the line of today, drawn once behind every row of the Gantt timeline.
export default function GanttDayBackground({
  timeline,
}: {
  timeline: GanttTimeline;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-0 flex"
      style={{ left: GANTT_LIST_WIDTH }}
    >
      {timeline.days.map((day) => (
        <div
          key={day.iso}
          className={cn(
            "h-full shrink-0",
            day.isMonday && "border-l border-border/60",
            day.isWeekend && "bg-muted/50",
          )}
          style={{ width: GANTT_DAY_WIDTH }}
        >
          {day.isToday && (
            <div className="mx-auto h-full w-0.5 bg-kb-blue-fg" />
          )}
        </div>
      ))}
    </div>
  );
}
