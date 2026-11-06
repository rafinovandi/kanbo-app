import type { Tables } from "./database.types";

// Row shape comes from the generated Supabase types (never edit database.types.ts by hand).
export type Profile = Tables<"profiles">;

// The signed-in user's profile as used across the app shell (sidebar, auth store).
export type AuthProfile = Pick<
  Profile,
  "id" | "email" | "name" | "username" | "avatar_url" | "avatar_bg" | "avatar_fg" | "timezone"
>;

export type ProfileFormState = {
  status?: string;
  errors?: {
    name?: string[];
    username?: string[];
    headline?: string[];
    bio?: string[];
    location?: string[];
    website?: string[];
    telegram_username?: string[];
    avatar_url?: string[];
    _form?: string[];
  };
};
