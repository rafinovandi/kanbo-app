import { useQuery } from "@tanstack/react-query";

import { EMPTY_DASHBOARD_STATS } from "@/constants/dashboard-constant";
import { useHydrated } from "@/hooks/use-hydrated";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/types/project";

export const DASHBOARD_STATS_KEY = ["dashboard-stats"];

type Supabase = ReturnType<typeof createClient>;

// Numbers for the signed-in user's active projects (dashboard_stats() RPC).
export async function fetchDashboardStats(supabase: Supabase): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("dashboard_stats");
  if (error) throw error;
  return { ...EMPTY_DASHBOARD_STATS, ...(data as Partial<DashboardStats> | null) };
}

// While a component hydrates, the cache may already hold numbers that the server HTML did not have (the sidebar
// and the page hydrate at different times), so report "no data yet" until hydration is done.
export default function useDashboardStats() {
  const supabase = createClient();
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: () => fetchDashboardStats(supabase),
  });
  return hydrated ? query : { ...query, data: undefined, isLoading: true, isError: false };
}
