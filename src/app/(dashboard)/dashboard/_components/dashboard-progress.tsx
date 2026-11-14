"use client";

import ProgressRing2 from "@/components/common/progress-ring-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_STATUSES } from "@/constants/dashboard-constant";
import type { DashboardStats } from "@/types/project";

export default function DashboardProgress({
  stats,
}: {
  stats: DashboardStats;
}) {
  const segments = DASHBOARD_STATUSES.filter(
    (s) => s.key !== "other" || stats.other > 0,
  ).map((s) => ({
    key: s.key,
    label: s.label,
    value: stats[s.key],
    color: s.color,
  }));

  return (
    <Card aria-label="Overall progress">
      <CardHeader>
        <CardTitle className="text-[15px] font-semibold">
          Overall progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressRing2
          segments={segments}
          total={stats.total}
          totalLabel="tasks"
        />
      </CardContent>
    </Card>
  );
}
