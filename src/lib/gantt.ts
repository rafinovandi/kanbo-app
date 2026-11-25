// Date math for the Gantt timeline. Days are "YYYY-MM-DD" strings, so nothing here depends on the
// browser's own time zone; a task's created time is turned into a day in the member's time zone first.

const DAY_MS = 86_400_000;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export type GanttDay = {
  iso: string;
  weekday: number;
  dayOfMonth: number;
  isToday: boolean;
  isWeekend: boolean;
  isMonday: boolean;
};

export type GanttMonth = { label: string; days: number };

export type GanttTimeline = {
  start: string;
  days: GanttDay[];
  months: GanttMonth[];
};

export const dayIndex = (iso: string) =>
  Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);

export const dayFromIndex = (index: number) =>
  new Date(index * DAY_MS).toISOString().slice(0, 10);

export const addDays = (iso: string, amount: number) =>
  dayFromIndex(dayIndex(iso) + amount);

export const diffDays = (from: string, to: string) =>
  dayIndex(to) - dayIndex(from);

// The calendar day of a timestamp in an IANA time zone (UTC when the zone is unknown).
export function toLocalDay(timestamp: string, timeZone: string): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestamp));
  try {
    return format(timeZone);
  } catch {
    return format("UTC");
  }
}

// "2026-11-03" → "Nov 3"
export function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

// A bar runs from the created day to the due day; without a usable due day it is one day long.
export function getSpan(
  created: string,
  due: string | null,
): { start: string; end: string; hasDue: boolean } {
  const hasDue = !!due && due >= created;
  return { start: created, end: hasDue ? (due as string) : created, hasDue };
}

export function formatRange(created: string, due: string | null): string {
  const { start, end, hasDue } = getSpan(created, due);
  if (!hasDue) return `${formatDay(start)} · No due date`;
  const days = diffDays(start, end) + 1;
  return `${formatDay(start)} – ${formatDay(end)} · ${days} ${days === 1 ? "day" : "days"}`;
}

// From 2 days before the earliest start to 6 days after the latest end, beginning on a Monday and always
// containing today.
export function buildTimeline(
  spans: { start: string; end: string }[],
  today: string,
): GanttTimeline {
  let first = dayIndex(today);
  let last = first;
  for (const span of spans) {
    first = Math.min(first, dayIndex(span.start));
    last = Math.max(last, dayIndex(span.end));
  }
  first -= 2;
  last += 6;
  while (new Date(first * DAY_MS).getUTCDay() !== 1) first -= 1;

  const days: GanttDay[] = [];
  const months: GanttMonth[] = [];
  let currentMonth = "";
  for (let index = first; index <= last; index++) {
    const date = new Date(index * DAY_MS);
    const weekday = date.getUTCDay();
    const iso = dayFromIndex(index);
    days.push({
      iso,
      weekday,
      dayOfMonth: date.getUTCDate(),
      isToday: iso === today,
      isWeekend: weekday === 0 || weekday === 6,
      isMonday: weekday === 1,
    });
    const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    if (monthKey === currentMonth) months[months.length - 1].days += 1;
    else {
      currentMonth = monthKey;
      months.push({
        label: `${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
        days: 1,
      });
    }
  }
  return { start: days[0].iso, days, months };
}

// The earliest due day a task may get: the day after it was created, and never in the past.
export const earliestDueDate = (created: string, today: string) =>
  addDays(created, 1) > today ? addDays(created, 1) : today;

// The due day a drag onto `candidate` would save. Back on the created day means "no due date" (null); a day in
// the past snaps forward to the earliest allowed day, so lengthening a task never clears it.
export function resolveDueDate({
  created,
  today,
  candidate,
}: {
  created: string;
  today: string;
  candidate: string;
}) {
  if (candidate <= created) return null;
  const earliest = earliestDueDate(created, today);
  return candidate < earliest ? earliest : candidate;
}

// One keyboard step on the bar's end: the next due day, or null once it goes back to the created day.
export function stepDueDate({
  created,
  today,
  current,
  direction,
}: {
  created: string;
  today: string;
  current: string | null;
  direction: 1 | -1;
}) {
  const earliest = earliestDueDate(created, today);
  if (direction === 1) {
    if (!current || current < created) return earliest;
    const next = addDays(current, 1);
    return next < earliest ? earliest : next;
  }
  if (!current || current < created) return null;
  const previous = addDays(current, -1);
  return previous < earliest ? null : previous;
}
