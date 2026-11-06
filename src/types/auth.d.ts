import type { Tables } from "./database.types";

// Row shape comes from the generated Supabase types (never edit database.types.ts by hand).
export type Profile = Tables<"profiles">;

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
