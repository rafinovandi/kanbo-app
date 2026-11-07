import { useQuery } from "@tanstack/react-query";

import { DUE_SOON_DAYS } from "@/constants/notification-constant";
import { createClient } from "@/lib/supabase/client";
import { getTodayInTimeZone } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { DueNotification } from "@/types/notification";
import type { ProjectColor } from "@/types/project";

export const DUE_NOTIFICATIONS_KEY = ["due-notifications"];

// Tasks assigned to me that are overdue or due within DUE_SOON_DAYS, relative to today in my time zone. `today` comes
// back with the tasks, so nothing reads the clock while rendering (not allowed in prerendered pages).
export default function useDueNotifications() {
  const supabase = createClient();
  const timezone = useAuthStore((state) => state.profile.timezone);
  return useQuery({
    queryKey: [...DUE_NOTIFICATIONS_KEY, timezone],
    queryFn: async (): Promise<{ today: string; items: DueNotification[] }> => {
      const today = getTodayInTimeZone(timezone);
      const { data, error } = await supabase.rpc("my_due_notifications", { p_today: today, p_days: DUE_SOON_DAYS });
      if (error) throw error;
      const items = data.map((row) => ({
        taskId: row.task_id,
        projectId: row.project_id,
        projectName: row.project_name,
        projectColor: row.project_color as ProjectColor,
        title: row.title,
        dueDate: row.due_date,
      }));
      return { today, items };
    },
  });
}
