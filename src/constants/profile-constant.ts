import type { ProjectColor } from "@/types/profile";

// Project tones (dot / progress bar), same palette as the project color picker.
export const PROJECT_TONE: Record<ProjectColor, { dot: string; bar: string }> =
  {
    gray: { dot: "bg-kb-gray", bar: "bg-kb-gray" },
    blue: { dot: "bg-kb-blue", bar: "bg-kb-blue" },
    lilac: { dot: "bg-kb-lilac", bar: "bg-kb-lilac" },
    pink: { dot: "bg-kb-pink", bar: "bg-kb-pink" },
    orange: { dot: "bg-kb-orange", bar: "bg-kb-orange" },
    green: { dot: "bg-kb-green", bar: "bg-kb-green" },
  };

// Activity graph: tasks per day → level 0..4 (0, 1–2, 3–4, 5–6, 7+).
export const ACTIVITY_DAYS = 365;
export const RECENT_TASKS_LIMIT = 6;

// Profile field limits (match the CHECK constraints in 002_profiles.sql).
export const PROFILE_LIMITS = {
  name: 60,
  headline: 60,
  bio: 160,
  location: 80,
  website: 200,
  usernameMin: 3,
  username: 30,
  telegramMin: 5,
  telegram: 32,
} as const;

export const PRIVACY_KEYS = [
  "show_stats",
  "show_activity",
  "show_pinned",
  "show_recent_tasks",
] as const;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg"];

// Profile activity graph colour, chosen by the owner. `levels` are the classes for the 4 active levels, least to most.
export const ACTIVITY_COLORS = ["primary", "green", "mono"] as const;
export type ActivityColor = (typeof ACTIVITY_COLORS)[number];
export const DEFAULT_ACTIVITY_COLOR: ActivityColor = "primary";
export const ACTIVITY_PALETTE: Record<
  ActivityColor,
  { label: string; levels: [string, string, string, string] }
> = {
  primary: {
    label: "Primary",
    levels: [
      "bg-kb-activity-1",
      "bg-kb-activity-2",
      "bg-kb-activity-3",
      "bg-kb-activity-4",
    ],
  },
  green: {
    label: "Green",
    levels: [
      "bg-kb-green/30",
      "bg-kb-green/60",
      "bg-kb-green",
      "bg-kb-green-fg",
    ],
  },
  mono: {
    label: "Black & white",
    levels: [
      "bg-foreground/25",
      "bg-foreground/50",
      "bg-foreground/75",
      "bg-foreground",
    ],
  },
};
