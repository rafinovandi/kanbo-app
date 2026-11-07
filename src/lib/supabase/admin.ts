import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { environment } from "@/configs/environment";
import type { Database } from "@/types/database.types";

// Service role: bypasses RLS and has no user session. Server only; every caller must check access itself.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set");

  return createSupabaseClient<Database>(environment.SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
