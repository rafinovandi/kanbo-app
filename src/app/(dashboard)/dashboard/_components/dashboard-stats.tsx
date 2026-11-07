import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_STATUSES } from "@/constants/dashboard-constant";
import type { DashboardStats } from "@/types/project";

function StatBox({ label, count, dotClass }: { label: string; count: number; dotClass: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3.5">
        <span className="flex items-center gap-2 text-[13px] font-medium text-kb-text-2">
          <span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />
          {label}
        </span>
        <span className="text-[30px] leading-none font-semibold tracking-[-0.02em]">{count}</span>
      </CardContent>
    </Card>
  );
}

export default function DashboardStatBoxes({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
      <StatBox label="Total tasks" count={stats.total} dotClass="bg-foreground" />
      {DASHBOARD_STATUSES.filter((s) => s.key !== "other" || stats.other > 0).map((s) => (
        <StatBox key={s.key} label={s.label} count={stats[s.key]} dotClass={s.dotClass} />
      ))}
    </div>
  );
}
