import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { boardKey } from "@/hooks/use-board";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { DUE_NOTIFICATIONS_KEY } from "@/hooks/use-due-notifications";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import type { BoardData } from "@/types/board";

type Result = { status: "success" } | { status: "error"; message: string };

// Optimistic write on a project's board: shows `update` in the cached board right away, runs the server action,
// and puts the board back with a toast when it fails. Returns whether the save worked.
export default function useBoardMutation(projectId: string) {
  const queryClient = useQueryClient();

  return async (update: (data: BoardData) => BoardData, run: () => Promise<Result>) => {
    const snapshot = queryClient.getQueriesData<BoardData | null>({ queryKey: boardKey(projectId) });
    queryClient.setQueriesData<BoardData | null>({ queryKey: boardKey(projectId) }, (old) => old && update(old));

    const result = await run();
    if (result.status === "error") {
      snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(result.message);
      return false;
    }
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    queryClient.invalidateQueries({ queryKey: DUE_NOTIFICATIONS_KEY });
    return true;
  };
}
