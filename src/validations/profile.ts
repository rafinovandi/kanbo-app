import { PRIVACY_KEYS, PROFILE_LIMITS } from "@/constants/profile-constant";
import type { ProfileFormState } from "@/types/auth";

export type ProfileFields = {
  name: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  username: string;
  telegram_username: string;
} & Record<(typeof PRIVACY_KEYS)[number], boolean>;

export type ProfileTextKey = {
  [K in keyof ProfileFields]: ProfileFields[K] extends string ? K : never;
}[keyof ProfileFields];

// Pure validation shared by the form (live "Full name is required") and the server action.
// Mirrors the CHECK constraints in 002_profiles.sql and 010_security_hardening.sql (website must be
// http/https). (No zod in the project yet.)
export function validateProfile(input: ProfileFields): {
  values: ProfileFields;
  errors: NonNullable<ProfileFormState["errors"]>;
} {
  const values: ProfileFields = {
    name: input.name.trim(),
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    location: input.location.trim(),
    website: input.website.trim(),
    username: input.username.trim().toLowerCase(),
    telegram_username: input.telegram_username.trim().replace(/^@/, ""),
    show_stats: input.show_stats,
    show_activity: input.show_activity,
    show_pinned: input.show_pinned,
    show_recent_tasks: input.show_recent_tasks,
  };
  const errors: NonNullable<ProfileFormState["errors"]> = {};

  if (!values.name) errors.name = ["Full name is required"];
  else if (values.name.length > PROFILE_LIMITS.name)
    errors.name = [`Max ${PROFILE_LIMITS.name} characters`];
  if (values.headline.length > PROFILE_LIMITS.headline)
    errors.headline = [`Max ${PROFILE_LIMITS.headline} characters`];
  if (values.bio.length > PROFILE_LIMITS.bio)
    errors.bio = [`Max ${PROFILE_LIMITS.bio} characters`];
  if (values.location.length > PROFILE_LIMITS.location)
    errors.location = [`Max ${PROFILE_LIMITS.location} characters`];
  if (
    !/^[a-z0-9_-]+$/.test(values.username) ||
    values.username.length < PROFILE_LIMITS.usernameMin ||
    values.username.length > PROFILE_LIMITS.username
  ) {
    errors.username = [
      `Use ${PROFILE_LIMITS.usernameMin}–${PROFILE_LIMITS.username} lowercase letters, numbers, - or _`,
    ];
  }
  if (
    values.telegram_username &&
    !/^[A-Za-z0-9_]{5,32}$/.test(values.telegram_username)
  ) {
    errors.telegram_username = [
      `Use ${PROFILE_LIMITS.telegramMin}–${PROFILE_LIMITS.telegram} letters, numbers or _`,
    ];
  }
  if (values.website) {
    let ok = values.website.length <= PROFILE_LIMITS.website;
    try {
      const url = new URL(values.website);
      ok = ok && (url.protocol === "https:" || url.protocol === "http:");
    } catch {
      ok = false;
    }
    if (!ok) errors.website = ["Enter a valid link starting with https://"];
  }

  return { values, errors };
}

// Real image type from the first bytes of the file (PNG / JPEG signatures). The browser-reported
// `file.type` and the file name come from the client, so the server never trusts them alone.
export function detectAvatarType(
  bytes: Uint8Array,
): "image/png" | "image/jpeg" | null {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  return null;
}
