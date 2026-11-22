import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { ProjectMembers } from "@/types/project";

export const projectMembersKey = (projectId: string) => [
  "project-members",
  projectId,
];

// The members and pending invites of one project, plus its creator. Order: creator, active members
// (oldest first), then pending invites.
export default function useProjectMembers(projectId: string, enabled = true) {
  const supabase = createClient();
  return useQuery({
    queryKey: projectMembersKey(projectId),
    enabled,
    queryFn: async (): Promise<ProjectMembers> => {
      const [{ data: project, error: projectError }, { data: rows, error }] =
        await Promise.all([
          supabase
            .from("projects")
            .select("owner_id")
            .eq("id", projectId)
            .single(),
          supabase
            .from("project_members")
            .select(
              "id, user_id, email, status, is_admin, roles, invited_at, accepted_at, profiles!project_members_user_id_fkey(id, name, username, avatar_url, avatar_bg, avatar_fg)",
            )
            .eq("project_id", projectId),
        ]);
      if (projectError) throw projectError;
      if (error) throw error;

      const ownerId = project.owner_id;
      const rank = (row: (typeof rows)[number]) =>
        row.user_id === ownerId ? 0 : row.status === "active" ? 1 : 2;
      const since = (row: (typeof rows)[number]) =>
        row.accepted_at ?? row.invited_at;

      const members = rows
        .toSorted(
          (a, b) => rank(a) - rank(b) || since(a).localeCompare(since(b)),
        )
        .map((row) => ({
          id: row.id,
          userId: row.user_id,
          email: row.email,
          status: row.status,
          isAdmin: row.is_admin,
          roles: row.roles,
          profile: row.profiles,
        }));

      return { ownerId, members };
    },
  });
}
