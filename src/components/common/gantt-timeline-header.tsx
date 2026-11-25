import { GANTT_DAY_WIDTH, GANTT_LIST_WIDTH } from "@/constants/gantt-constant";
import { WEEKDAY_INITIALS, type GanttTimeline } from "@/lib/gantt";
import { cn } from "@/lib/utils";

const LIST_CELL =
  "sticky left-0 z-40 flex shrink-0 items-center border-r bg-card px-2 text-xs sm:px-4 font-medium text-muted-foreground";

// The sticky top of the Gantt timeline: a row of months, then a row of days with today marked.
export default function GanttTimelineHeader({
  timeline,
  taskCount,
}: {
  timeline: GanttTimeline;
  taskCount: number;
}) {
  return (
    <div className="sticky top-0 z-30 border-b bg-card">
      <div className="flex h-10">
        <div className={LIST_CELL} style={{ width: GANTT_LIST_WIDTH }}>
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </div>
        {timeline.months.map((month) => (
          <div
            key={month.label}
            className="flex shrink-0 items-center border-l text-sm font-semibold whitespace-nowrap first:border-l-0"
            style={{ width: month.days * GANTT_DAY_WIDTH }}
          >
            <span className="sticky px-3" style={{ left: GANTT_LIST_WIDTH }}>
              {month.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex h-10">
        <div className={LIST_CELL} style={{ width: GANTT_LIST_WIDTH }}>
          Task
        </div>
        {timeline.days.map((day) => (
          <div
            key={day.iso}
            className="flex shrink-0 items-center justify-center gap-1 text-xs"
            style={{ width: GANTT_DAY_WIDTH }}
          >
            <span
              className={
                day.isToday
                  ? "font-medium text-kb-blue-fg"
                  : "text-muted-foreground"
              }
            >
              {WEEKDAY_INITIALS[day.weekday]}
            </span>
            <span
              className={cn(
                "inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1 font-semibold",
                day.isToday
                  ? "bg-kb-blue-fg text-background"
                  : day.isWeekend && "text-muted-foreground",
              )}
            >
              {day.dayOfMonth}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
