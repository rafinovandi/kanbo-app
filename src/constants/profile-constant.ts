import type { ProjectColor } from "@/types/profile";

// Project tones (dot / progress bar), same palette as the project color picker.
export const PROJECT_TONE: Record<ProjectColor, { dot: string; bar: string }> = {
  gray: { dot: "bg-kb-gray", bar: "bg-kb-gray" },
  blue: { dot: "bg-kb-blue", bar: "bg-kb-blue" },
  lilac: { dot: "bg-kb-lilac", bar: "bg-kb-lilac" },
  pink: { dot: "bg-kb-pink", bar: "bg-kb-pink" },
  orange: { dot: "bg-kb-orange", bar: "bg-kb-orange" },
  green: { dot: "bg-kb-green", bar: "bg-kb-green" },
};

// Activity graph: tasks per day → level 0..4 (spec §12: 0, 1–2, 3–4, 5–6, 7+).
export const ACTIVITY_DAYS = 365;
export const RECENT_TASKS_LIMIT = 6;

// Profile field limits (match the CHECK constraints in 002_profiles.sql).
export const PROFILE_LIMITS = {
  name: 60,
  headline: 60,
  bio: 160,
  location: 80,
  website: 200,
} as const;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg"];
