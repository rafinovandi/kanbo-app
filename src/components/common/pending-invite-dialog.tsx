"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { acceptPendingInviteAction } from "@/actions/invite-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PROJECT_TILE } from "@/constants/project-constant";
import { DASHBOARD_STATS_KEY } from "@/hooks/use-dashboard-stats";
import { PENDING_INVITES_KEY } from "@/hooks/use-pending-invites";
import { PROJECTS_OVERVIEW_KEY } from "@/hooks/use-projects-overview";
import { cn } from "@/lib/utils";
import type { PendingInvite } from "@/types/project";

// Opens from the dashboard banner: review the invite and accept it. There is no decline: an invite
// the user does not want just stays until the project's admin cancels it.
export default function PendingInviteDialog({ invite, children }: { invite: PendingInvite; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const accept = async () => {
    setPending(true);
    const result = await acceptPendingInviteAction(invite.member_id);
    setPending(false);

    queryClient.invalidateQueries({ queryKey: PENDING_INVITES_KEY });
    if (result.status === "error") return void toast.error(result.message);

    toast.success(`You joined ${invite.project_name}`);
    queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: PROJECTS_OVERVIEW_KEY });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-[420px]">
        <DialogHeader className="items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-lg font-semibold",
              PROJECT_TILE[invite.project_color],
            )}
          >
            {invite.project_name[0].toUpperCase()}
          </span>
          <DialogTitle className="text-lg font-semibold">Join {invite.project_name}?</DialogTitle>
          <DialogDescription>
            {invite.invited_by_name ?? "A teammate"} invited you to join this project. Once you accept, its board and
            tasks show up in your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Not Now
            </Button>
          </DialogClose>
          <Button type="button" onClick={accept} disabled={pending}>
            {pending ? "Joining…" : "Accept Invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
