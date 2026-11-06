import { createBrowserClient } from "@supabase/ssr";

import { environment } from "@/configs/environment";
import type { Database } from "@/types/database.types";

// Browser client: carries the user's session (cookies), so RLS and Realtime work.
// Use this in client components — never a plain supabase-js client without a session.
export function createClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = environment;
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
