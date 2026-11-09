import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { TASK_STATUS_ORDER } from "@/constants/my-tasks-constant";
import { createClient } from "@/lib/supabase/client";
import { escapeLikePattern } from "@/lib/utils";
import type { MemberPreview, ProjectColor, ProjectOverview, ProjectTask } from "@/types/project";

import { fetchDashboardStats } from "./use-dashboard-stats";

export const PROJECTS_OVERVIEW_KEY = ["projects-overview"];

const statusRank = (task: ProjectTask) => TASK_STATUS_ORDER[task.status.key ?? "custom"];

// Status first, then the nearest due date (tasks without one last).
const byStatusThenDue = (a: ProjectTask, b: ProjectTask) =>
  statusRank(a) - statusRank(b) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");

// Projects with their members, progress and tasks, for My Tasks. RLS limits the rows to projects
// the user belongs to. With a search, only tasks whose title matches come back, and projects
// without a match are dropped.
export default function useProjectsOverview(search = "") {
  const supabase = createClient();
  return useQuery({
    queryKey: [...PROJECTS_OVERVIEW_KEY, search],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ProjectOverview[]> => {
      const query = supabase
        .from("projects")
        .select(
          "id, name, description, color, project_members(status, user_id, is_admin, profiles!project_members_user_id_fkey(id, name, avatar_url, avatar_bg, avatar_fg)), tasks(id, title, priority, due_date, categories!tasks_category_same_project_fk(key, name, color))",
        )
        .order("created_at", { ascending: false });

      const [{ data: rows, error }, stats] = await Promise.all([
        search ? query.ilike("tasks.title", `%${escapeLikePattern(search)}%`) : query,
        fetchDashboardStats(supabase),
      ]);
      if (error) throw error;

      const progress = new Map(stats.projects.map((p) => [p.id, p]));
      return rows.filter((row) => !search || row.tasks.length > 0).map((row) => {
        const members: MemberPreview[] = [];
        const adminIds: string[] = [];
        let pending = 0;
        for (const member of row.project_members) {
          if (member.is_admin && member.user_id) adminIds.push(member.user_id);
          if (member.status === "pending") pending += 1;
          else if (member.profiles) members.push(member.profiles);
        }

        const tasks: ProjectTask[] = row.tasks
          .filter((task) => task.categories)
          .map((task) => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: task.due_date,
            status: {
              key: task.categories!.key,
              name: task.categories!.name,
              color: task.categories!.color as ProjectColor,
            },
          }))
          .sort(byStatusThenDue);

        const stat = progress.get(row.id);
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          color: row.color as ProjectColor,
          members,
          adminIds,
          pending,
          total: stat?.total ?? 0,
          done: stat?.done ?? 0,
          tasks,
        };
      });
    },
  });
}
