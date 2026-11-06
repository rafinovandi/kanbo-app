import { ACTIVITY_DAYS } from "@/constants/profile-constant";
import type {
  ContributionData,
  ContributionDay,
  ContributionLevel,
} from "@/components/spaceui/github-activity";
import type { ActivityRow, ActivitySummary } from "@/types/profile";

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-20" for `date` in the given IANA timezone (UTC if the zone is invalid).
export function todayInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const toMs = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// "Oct 20" / "Oct 20, 2026"
export function formatDayLabel(iso: string, withYear = false): string {
  const d = new Date(toMs(iso));
  const label = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${label}, ${d.getUTCFullYear()}` : label;
}

// "Oct 20" for a timestamp, in the user's timezone.
export function formatCompletedDate(timestamp: string, timeZone: string): string {
  return formatDayLabel(todayInTimezone(new Date(timestamp), timeZone));
}

const levelOf = (count: number): ContributionLevel =>
  count === 0
    ? "NONE"
    : count <= 2
      ? "FIRST_QUARTILE"
      : count <= 4
        ? "SECOND_QUARTILE"
        : count <= 6
          ? "THIRD_QUARTILE"
          : "FOURTH_QUARTILE";

// Turns activity_graph() rows into the heatmap grid (Sunday-first weeks covering the last
// ACTIVITY_DAYS days up to `today`) plus the numbers shown under it.
export function buildActivity(
  rows: ActivityRow[],
  today: string,
): { contributions: ContributionData; summary: ActivitySummary } {
  const counts = new Map(rows.map((r) => [r.day, r.completed]));
  const todayMs = toMs(today);
  const startMs = todayMs - (ACTIVITY_DAYS - 1) * DAY_MS;
  const gridStart = startMs - new Date(startMs).getUTCDay() * DAY_MS;
  const gridEnd = todayMs + (6 - new Date(todayMs).getUTCDay()) * DAY_MS;
  const weekStart = todayMs - new Date(todayMs).getUTCDay() * DAY_MS;

  const weeks: ContributionData["weeks"] = [];
  const series: { iso: string; count: number }[] = [];
  let total = 0;
  let thisWeek = 0;

  for (let ms = gridStart; ms <= gridEnd; ms += 7 * DAY_MS) {
    const contributionDays: ContributionDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayMs = ms + i * DAY_MS;
      if (dayMs < startMs || dayMs > todayMs) {
        contributionDays.push({ date: "", contributionCount: 0, contributionLevel: "NONE" });
        continue;
      }
      const iso = toIso(dayMs);
      const count = counts.get(iso) ?? 0;
      total += count;
      if (dayMs >= weekStart) thisWeek += count;
      series.push({ iso, count });
      contributionDays.push({ date: iso, contributionCount: count, contributionLevel: levelOf(count) });
    }
    weeks.push({ contributionDays });
  }

  // Current streak: consecutive days with tasks up to today (a quiet today doesn't break it yet).
  let streak = 0;
  let i = series.length - 1;
  if (i >= 0 && series[i].count === 0) i--;
  for (; i >= 0 && series[i].count > 0; i--) streak++;

  let longest = 0;
  let run = 0;
  let best = series[0] ?? { iso: today, count: 0 };
  for (const day of series) {
    run = day.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
    if (day.count > best.count) best = day;
  }

  return {
    contributions: { totalContributions: total, weeks },
    summary: {
      total,
      rangeLabel: `${formatDayLabel(toIso(startMs), true)} – ${formatDayLabel(today, true)}`,
      streak,
      longest,
      bestCount: best.count,
      bestDateLabel: best.count > 0 ? formatDayLabel(best.iso) : "—",
      thisWeek,
    },
  };
}
