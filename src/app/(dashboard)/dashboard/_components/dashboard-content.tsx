"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useDashboardStats from "@/hooks/use-dashboard-stats";

import DashboardEmpty from "./dashboard-empty";
import DashboardProgress from "./dashboard-progress";
import DashboardProjects from "./dashboard-projects";
import DashboardStatBoxes from "./dashboard-stats";

// With projects: stat boxes and the two cards. Without: the empty state (spec §5).
export default function DashboardContent() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return <p className="text-sm text-muted-foreground">Could not load your dashboard. Refresh to try again.</p>;
  }

  if (stats.project_count === 0) return <DashboardEmpty />;

  return (
    <>
      <DashboardStatBoxes stats={stats} />
      <Separator />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-start gap-4">
        <DashboardProjects projects={stats.projects} />
        <DashboardProgress stats={stats} />
      </div>
    </>
  );
}
