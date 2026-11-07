import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { boardKey } from "@/hooks/use-board";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { DUE_NOTIFICATIONS_KEY } from "@/hooks/use-due-notifications";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import { createClient } from "@/lib/supabase/client";
import type { BoardData } from "@/types/board";

const DEBOUNCE_MS = 300;

// Keeps a project's board in step with other people's changes (Supabase realtime on tasks, columns and assignees).
// Events only mark the cached data stale; a burst of events becomes one refetch.
export default function useBoardRealtime(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: boardKey(projectId) });
        queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
        queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
        queryClient.invalidateQueries({ queryKey: DUE_NOTIFICATIONS_KEY });
      }, DEBOUNCE_MS);
    };

    // task_assignees has no project_id to filter on, so only events for tasks of this board count.
    const onAssigneeChange = (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const taskId = payload.new.task_id ?? payload.old.task_id;
      const known = queryClient
        .getQueriesData<BoardData | null>({ queryKey: boardKey(projectId) })
        .some(([, data]) => data?.tasks.some((task) => task.id === taskId));
      if (known) refresh();
    };

    const channel = supabase
      .channel(`board-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `project_id=eq.${projectId}` },
        refresh,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, onAssigneeChange)
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
