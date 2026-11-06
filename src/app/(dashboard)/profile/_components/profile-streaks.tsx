import { Award, Calendar, ChartSuccess, Flash, type Icon } from "iconsax-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ActivitySummary } from "@/types/profile";

function StatCard({
  icon: StatIcon,
  tone,
  label,
  value,
  unit,
}: {
  icon: Icon;
  tone: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
      <span className="flex items-center gap-2 text-[13px] font-medium text-kb-text-2">
        <StatIcon size={18} variant="Linear" color="currentColor" className={tone} aria-hidden />
        {label}
      </span>
      <span className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
        {value} <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </span>
      </CardContent>
    </Card>
  );
}

export default function ProfileStreaks({ summary }: { summary: ActivitySummary }) {
  const days = (n: number) => (n === 1 ? "day" : "days");
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10.5rem,100%),1fr))] gap-3.5">
      <StatCard icon={Flash} tone="text-kb-orange" label="Current streak" value={summary.streak} unit={days(summary.streak)} />
      <StatCard icon={Award} tone="text-kb-blue" label="Longest streak" value={summary.longest} unit={days(summary.longest)} />
      <StatCard
        icon={ChartSuccess}
        tone="text-kb-green"
        label="Best day"
        value={summary.bestCount}
        unit={summary.bestCount > 0 ? `on ${summary.bestDateLabel}` : "tasks"}
      />
      <StatCard icon={Calendar} tone="text-kb-text-2" label="This week" value={summary.thisWeek} unit={summary.thisWeek === 1 ? "task" : "tasks"} />
    </div>
  );
}
