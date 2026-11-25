import type { ReactNode } from "react";

// One line of the Gantt legend: a small sample of the bar and what it means.
export default function GanttLegendRow({
  sample,
  title,
  text,
}: {
  sample: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2">
      <span aria-hidden className="flex w-11 shrink-0 justify-center">
        {sample}
      </span>
      <span className="flex min-w-0 flex-col gap-px">
        <span className="text-[13px] font-medium">{title}</span>
        <span className="text-xs leading-snug text-muted-foreground">
          {text}
        </span>
      </span>
    </div>
  );
}
