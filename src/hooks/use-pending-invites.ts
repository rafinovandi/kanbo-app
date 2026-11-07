import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { PendingInvite } from "@/types/project";

export const PENDING_INVITES_KEY = ["pending-invites"];

// Invites sent to the signed-in user's verified email (my_pending_invites() RPC).
export default function usePendingInvites() {
  const supabase = createClient();
  return useQuery({
    queryKey: PENDING_INVITES_KEY,
    queryFn: async (): Promise<PendingInvite[]> => {
      const { data, error } = await supabase.rpc("my_pending_invites");
      if (error) throw error;
      return data;
    },
  });
}
