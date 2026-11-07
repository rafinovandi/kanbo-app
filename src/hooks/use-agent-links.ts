import { useQuery } from "@tanstack/react-query";

import { listAgentLinksAction } from "@/actions/agent-link-action";

export const agentLinksKey = (projectId: string) => ["agent-links", projectId];

// The chats linked to a project (admins only). `pollMs` keeps refreshing while a link code is waiting to be used.
export default function useAgentLinks(projectId: string, enabled: boolean, pollMs: number | false = false) {
  return useQuery({
    queryKey: agentLinksKey(projectId),
    enabled,
    refetchInterval: pollMs,
    queryFn: async () => {
      const result = await listAgentLinksAction(projectId);
      if (result.status === "error") throw new Error(result.message);
      return result.links;
    },
  });
}
