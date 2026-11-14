import { useQuery } from "@tanstack/react-query";

import { formatDayLabel, todayInTimezone } from "@/lib/profile-activity";
import { createClient } from "@/lib/supabase/client";
import type { PeakPoint } from "@/components/common/peak-line-chart";
import type { ActivityRow } from "@/types/profile";

export const DASHBOARD_ACTIVITY_DAYS = 14;
export const DASHBOARD_ACTIVITY_KEY = [
  "dashboard-activity",
  DASHBOARD_ACTIVITY_DAYS,
];

const DAY_MS = 86_400_000;

// Tasks the signed-in user completed per day for the last DASHBOARD_ACTIVITY_DAYS days, oldest first, zero-filled.
export default function useDashboardActivity() {
  const supabase = createClient();
  return useQuery({
    queryKey: DASHBOARD_ACTIVITY_KEY,
    queryFn: async (): Promise<PeakPoint[]> => {
      const { data: claims } = await supabase.auth.getClaims();
      const userId = claims?.claims?.sub;
      if (!userId) return [];

      const { data, error } = await supabase.rpc("activity_graph", {
        p_user_id: userId,
        p_days: DASHBOARD_ACTIVITY_DAYS,
      });
      if (error) throw error;

      const counts = new Map(
        (data as ActivityRow[]).map((r) => [r.day, r.completed]),
      );
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [y, m, d] = todayInTimezone(new Date(), timeZone)
        .split("-")
        .map(Number);
      const todayMs = Date.UTC(y, m - 1, d);

      return Array.from({ length: DASHBOARD_ACTIVITY_DAYS }, (_, i) => {
        const iso = new Date(
          todayMs - (DASHBOARD_ACTIVITY_DAYS - 1 - i) * DAY_MS,
        )
          .toISOString()
          .slice(0, 10);
        return {
          key: iso,
          label: formatDayLabel(iso),
          value: counts.get(iso) ?? 0,
        };
      });
    },
  });
}
