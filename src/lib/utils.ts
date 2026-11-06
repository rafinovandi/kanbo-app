import type { CSSProperties } from "react";

export { cn } from "cn";

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

// Only same-site relative paths ("/dashboard", not "//evil.com" or "https://…") are allowed
// as a post-login destination; anything else falls back.
export function getSafeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

// True when `pathname` is `href` itself or a page below it ("/profile" matches "/profile/edit").
export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
