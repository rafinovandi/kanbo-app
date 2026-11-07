import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ProjectSummary } from "@/types/project";

// The signed-in user's projects, newest first, for Server Components. RLS limits the rows to
// projects the user owns or is an active member of. `cache` = one query per request.
export const getMyProjects = cache(async (): Promise<ProjectSummary[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, color")
    .order("created_at", { ascending: false });
  return data ?? [];
});
