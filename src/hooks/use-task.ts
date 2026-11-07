import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export const taskKey = (taskId: string) => ["task", taskId];

// The fields the board does not carry: a task's description and when it was created. Loaded when its modal opens.
export default function useTask(taskId: string, enabled: boolean) {
  const supabase = createClient();
  return useQuery({
    queryKey: taskKey(taskId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("description, created_at")
        .eq("id", taskId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
