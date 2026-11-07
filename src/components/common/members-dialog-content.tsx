"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_TILE } from "@/constants/project-constant";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import useProjectMembers, { projectMembersKey } from "@/hooks/use-project-members";
import { getMemberPermissions } from "@/lib/members";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { ProjectSummary } from "@/types/project";

import MemberRow from "./member-row";
import MembersInviteForm from "./members-invite-form";

// Body of the Members dialog (spec §8). Mounted only while the dialog is open, so the list is
// fetched on open and dropped on close.
export default function MembersDialogContent({ project, onLeft }: { project: ProjectSummary; onLeft: () => void }) {
  const me = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useProjectMembers(project.id);
  // Id of the row whose role panel is open; a just-invited person is matched by email until their row loads.
  const [rolesOpen, setRolesOpen] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: projectMembersKey(project.id) });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
  };

  const rows = data?.members ?? [];
  const iAmAdmin = rows.some((member) => member.userId === me.id && member.isAdmin);
  const pending = rows.filter((member) => member.status === "pending").length;
  const active = rows.length - pending;
  const admins = rows.filter((member) => member.isAdmin).length;

  return (
    <>
      <DialogHeader className="flex-row items-center gap-2.5 border-b border-kb-divider py-3.5 pr-16 pl-6">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 flex-none items-center justify-center rounded-[10px] text-sm font-semibold",
            PROJECT_TILE[project.color],
          )}
        >
          {project.name[0].toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <DialogTitle className="text-[15px] font-semibold">Members</DialogTitle>
          <DialogDescription className="truncate text-xs">
            {project.name} · {active} {active === 1 ? "member" : "members"}
            {pending > 0 && ` · ${pending} pending`}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-5 p-6 pt-5">
        {isLoading && <Skeleton className="h-40 rounded-xl" />}
        {isError && <p className="text-sm text-muted-foreground">Could not load the members. Close and try again.</p>}

        {data && (
          <>
            {iAmAdmin && (
              <MembersInviteForm
                projectId={project.id}
                onInvited={(email) => {
                  setRolesOpen(email);
                  refresh();
                }}
              />
            )}

            <div className="flex flex-col gap-1">
              <span className="pb-1 text-xs font-medium text-muted-foreground">
                {rows.length} {rows.length === 1 ? "person" : "people"} · {admins} {admins === 1 ? "admin" : "admins"}
              </span>
              <ul aria-label="Project members">
                {rows.map((row) => (
                  <MemberRow
                    key={row.id}
                    row={row}
                    projectName={project.name}
                    isSelf={row.userId === me.id}
                    permissions={getMemberPermissions({ meId: me.id, iAmAdmin, ownerId: data.ownerId, row })}
                    rolesOpen={rolesOpen === row.id || rolesOpen === row.email}
                    onToggleRoles={() => setRolesOpen(rolesOpen === row.id || rolesOpen === row.email ? null : row.id)}
                    onChanged={refresh}
                    onLeft={onLeft}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
