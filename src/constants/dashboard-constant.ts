import type { DashboardStats } from "@/types/project";

// Decorative preview in the Dashboard empty state (design: "Dashboard empty · Variant D").
// Classes are theme tokens (kb-* palette).

export const EMPTY_STAT_TILES = [
  { label: "To Do", dotClass: "bg-kb-gray" },
  { label: "In Progress", dotClass: "bg-kb-blue" },
  { label: "Done", dotClass: "bg-kb-green" },
];

// Skeleton "projects": tile + name + progress bar that fills and resets (6s loop).
// y = row offset in the 220×96 preview, bar = final fill (0..1), width = name bar width.
export const EMPTY_PROJECT_ROWS = [
  { y: 0, nameWidth: 90, bar: 0.545, delay: 0, fillClass: "fill-kb-blue" },
  { y: 48, nameWidth: 70, bar: 0.318, delay: 0.6, fillClass: "fill-kb-lilac" },
];

// Task statuses shown in the stat boxes and the progress legend. Custom columns of all
// projects are summed into "other".
export const DASHBOARD_STATUSES = [
  { key: "todo", label: "To Do", dotClass: "bg-kb-gray" },
  { key: "progress", label: "In Progress", dotClass: "bg-kb-blue" },
  { key: "review", label: "Review", dotClass: "bg-kb-lilac" },
  { key: "done", label: "Done", dotClass: "bg-kb-green" },
  { key: "other", label: "Other", dotClass: "bg-kb-orange" },
] as const;

export const getProgressPercent = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : 0;

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  project_count: 0,
  total: 0,
  todo: 0,
  progress: 0,
  review: 0,
  done: 0,
  other: 0,
  projects: [],
};
