import type { AuthProfile } from "@/types/auth";

export const INITIAL_STATE_PROFILE: AuthProfile = {
  id: "",
  email: "",
  name: "",
  username: "",
  avatar_url: null,
  // Fallback tone until the real profile (avatar_bg/fg set by the DB trigger) is loaded.
  avatar_bg: "var(--kb-blue-tint)",
  avatar_fg: "var(--kb-blue-fg)",
  timezone: "Asia/Jakarta",
};

// Columns selected for the signed-in user's profile (sidebar, greeting, store).
export const AUTH_PROFILE_COLUMNS =
  "id, email, name, username, avatar_url, avatar_bg, avatar_fg, timezone";
