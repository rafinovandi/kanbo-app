import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { escapeLikePattern } from "@/lib/utils";
import type { BoardData } from "@/types/board";
import type { ProjectColor } from "@/types/project";

export const boardKey = (projectId: string) => ["board", projectId];

// One project's columns and tasks, or null when it does not exist or is not readable (RLS). With a
// search, only tasks whose title matches come back.
export default function useBoard(projectId: string, search = "", enabled = true) {
  const supabase = createClient();
  return useQuery({
    queryKey: [...boardKey(projectId), search],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BoardData | null> => {
      const tasksQuery = supabase
        .from("tasks")
        .select(
          "id, category_id, title, priority, due_date, position, task_assignees(profiles!task_assignees_user_id_fkey(id, name, avatar_url, avatar_bg, avatar_fg))",
        )
        .eq("project_id", projectId)
        .order("position");

      const [project, categories, tasks] = await Promise.all([
        supabase.from("projects").select("id, name, color, owner_id").eq("id", projectId).maybeSingle(),
        supabase.from("categories").select("id, key, name, color").eq("project_id", projectId).order("position").order("created_at"),
        search ? tasksQuery.ilike("title", `%${escapeLikePattern(search)}%`) : tasksQuery,
      ]);
      if (project.error) throw project.error;
      if (categories.error) throw categories.error;
      if (tasks.error) throw tasks.error;
      if (!project.data) return null;

      return {
        project: {
          id: project.data.id,
          name: project.data.name,
          color: project.data.color as ProjectColor,
          ownerId: project.data.owner_id,
        },
        categories: categories.data.map((category) => ({ ...category, color: category.color as ProjectColor })),
        tasks: tasks.data.map((task) => ({
          id: task.id,
          categoryId: task.category_id,
          title: task.title,
          priority: task.priority,
          dueDate: task.due_date,
          position: task.position,
          assignees: task.task_assignees.flatMap((assignee) => (assignee.profiles ? [assignee.profiles] : [])),
        })),
      };
    },
  });
}
