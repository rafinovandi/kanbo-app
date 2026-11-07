"use client";

import useDashboardStats from "@/hooks/use-dashboard-stats";

// "N open tasks across M projects", or the no-projects line (spec §5).
export default function DashboardSubtitle() {
  const { data: stats } = useDashboardStats();
  if (!stats) return "…";
  if (stats.project_count === 0) return "You don't have any projects yet.";

  const open = stats.total - stats.done;
  const projects = stats.project_count;
  return `${open} open ${open === 1 ? "task" : "tasks"} across ${projects} ${projects === 1 ? "project" : "projects"}`;
}
