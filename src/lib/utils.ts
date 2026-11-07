import type { CSSProperties } from "react";

import { DEFAULT_ROLES, ROLE_CHIP_CLASS } from "@/constants/project-constant";

export { cn } from "cn";
export { getSafeRedirectPath } from "./safe-redirect";

// Inline style for a looping decorative animation. `name` is a kb-* keyframe in globals.css;
// `vars` sets the CSS custom properties some keyframes read (e.g. --kb-float, --kb-ring-to).
// Pair it with the `kb-anim` class so prefers-reduced-motion turns it off.
export function kbAnimation(
  name: string,
  duration: number,
  delay = 0,
  vars?: Record<string, string | number>,
  easing = "ease-in-out",
): CSSProperties {
  return { animation: `${name} ${duration}s ${easing} ${delay}s infinite`, ...vars } as CSSProperties;
}

// "Rafi Novandi" → "RN", "alya" → "AL"
export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Chip color of a role: fixed for the default roles, otherwise picked from a hash of the name.
export function getRoleChipClass(role: string): string {
  const fixed = DEFAULT_ROLES.find((r) => r.name === role);
  if (fixed) return ROLE_CHIP_CLASS[fixed.tone];
  const tones = Object.values(ROLE_CHIP_CLASS);
  const hash = [...role].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

// "Rafi Novandi" → "Rafi"
export function getFirstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}

// "Tuesday, 6 October 2026" in the given IANA timezone (profiles.timezone); UTC if it is invalid.
export function formatLongDate(date: Date, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).formatToParts(date);
  }
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`;
}

// A date as "6 Nov 2026" (task modal: due date and created on).
export function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

// "2026-10-23" → "Oct 23" (a date without time, so it is read as UTC to avoid shifting the day).
export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

// Makes user text safe inside an ilike pattern: %, _ and \ match themselves instead of acting as wildcards.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Today as "YYYY-MM-DD" in a time zone (falls back to UTC for an unknown one).
export function getTodayInTimeZone(timeZone: string): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  try {
    return format(timeZone);
  } catch {
    return format("UTC");
  }
}

// A local Date as "YYYY-MM-DD" (no UTC shift), and back to a local Date at midnight.
export function toDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// True when `pathname` is `href` itself or a page below it ("/profile" matches "/profile/edit").
export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
