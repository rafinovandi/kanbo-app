"use client";

import { Sms } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import usePendingInvites from "@/hooks/use-pending-invites";

import PendingInviteDialog from "./pending-invite-dialog";

// "You've been invited to {Project}" for every invite waiting for the user (spec §5).
export default function PendingInviteBanner() {
  const { data: invites } = usePendingInvites();
  if (!invites?.length) return null;

  return (
    <section aria-label="Pending invites" className="flex flex-col gap-3">
      {invites.map((invite) => (
        <Card key={invite.member_id}>
          <CardContent className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-kb-lilac-tint text-kb-lilac-fg"
            >
              <Sms size={20} variant="Linear" color="currentColor" />
            </span>
            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-semibold">
                You&apos;ve been invited to <span className="[overflow-wrap:anywhere]">{invite.project_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">by {invite.invited_by_name ?? "a teammate"}</p>
            </div>
            <PendingInviteDialog invite={invite}>
              <Button type="button" variant="outline">
                View Invite
              </Button>
            </PendingInviteDialog>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
