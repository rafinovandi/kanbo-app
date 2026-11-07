"use client";

import ProgressRing from "@/components/common/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_STATUSES, getProgressPercent } from "@/constants/dashboard-constant";
import type { DashboardStats } from "@/types/project";

export default function DashboardProgress({ stats }: { stats: DashboardStats }) {
  const percent = getProgressPercent(stats.done, stats.total);

  return (
    <Card aria-label="Overall progress">
      <CardHeader>
        <CardTitle className="text-[15px] font-semibold">Overall progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ProgressRing percent={percent} />

        <Separator />

        <ul className="flex flex-col gap-2">
          {DASHBOARD_STATUSES.filter((s) => s.key !== "other" || stats.other > 0).map((s) => (
            <li key={s.key} className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-kb-text-2">
                <span className={`size-2 rounded-full ${s.dotClass}`} aria-hidden="true" />
                {s.label}
              </span>
              <span className="font-semibold">{stats[s.key]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
