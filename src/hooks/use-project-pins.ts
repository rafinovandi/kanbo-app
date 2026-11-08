import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export const PROJECT_PINS_KEY = ["project-pins"];

// Ids of the projects the signed-in user pinned to their profile (RLS only returns their rows).
export default function useProjectPins() {
  const supabase = createClient();
  return useQuery({
    queryKey: PROJECT_PINS_KEY,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("project_pins").select("project_id");
      if (error) throw error;
      return data.map((row) => row.project_id);
    },
  });
}
