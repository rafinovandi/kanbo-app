import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { AgentBot } from "@/types/agent";

export const AGENT_BOTS_KEY = ["agent-bots"];

// The signed-in user's own bots (RLS only returns their rows). The token itself is never selected.
export default function useAgentBots(enabled = true) {
  const supabase = createClient();
  return useQuery({
    queryKey: AGENT_BOTS_KEY,
    enabled,
    queryFn: async (): Promise<AgentBot[]> => {
      const { data, error } = await supabase
        .from("agent_bots")
        .select("id, name, bot_username, token_hint, created_at")
        .is("revoked_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
