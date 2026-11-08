"use client";

import { More } from "iconsax-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  removeMemberAction,
  resendInviteAction,
  setMemberAdminAction,
  updateMemberRolesAction,
  type MemberActionResult,
} from "@/actions/member-action";
import UserAvatar from "@/components/common/user-avatar";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemberPermissions } from "@/lib/members";
import { cn } from "@/lib/utils";
import type { MemberRow as MemberRowData } from "@/types/project";

import { AddRoleButton, RoleChip, RolePicker } from "./role-picker";

export default function MemberRow({
  row,
  projectName,
  isSelf,
  permissions,
  rolesOpen,
  onToggleRoles,
  onChanged,
  onLeft,
}: {
  row: MemberRowData;
  projectName: string;
  isSelf: boolean;
  permissions: MemberPermissions;
  rolesOpen: boolean;
  onToggleRoles: () => void;
  onChanged: () => void;
  onLeft: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(row.roles);
  const [confirm, setConfirm] = useState<"remove" | "leave" | null>(null);

  const pending = row.status === "pending";
  const name = row.profile?.name ?? row.email;
  const profileHref = !pending && row.profile?.username ? `/u/${row.profile.username}` : null;

  const run = async (task: () => Promise<MemberActionResult>, success?: string) => {
    setBusy(true);
    const result = await task();
    setBusy(false);
    if (result.status === "error") {
      toast.error(result.message);
      return null;
    }
    if (success) toast.success(success);
    onChanged();
    return result;
  };

  const openRoles = () => {
    setDraft(row.roles);
    onToggleRoles();
  };

  const saveRoles = async () => {
    const unchanged = draft.length === row.roles.length && draft.every((role) => row.roles.includes(role));
    if (unchanged || (await run(() => updateMemberRolesAction(row.id, draft), "Roles updated"))) onToggleRoles();
  };

  const copyNewLink = async () => {
    const result = await run(() => resendInviteAction(row.id));
    if (result?.status !== "success" || !result.link) return;
    try {
      await navigator.clipboard.writeText(result.link);
      toast.success("New link copied", { description: "The previous link no longer works." });
    } catch {
      toast.info("New invite link", { description: result.link, duration: Infinity });
    }
  };

  const leave = async () => {
    const result = await run(() => removeMemberAction(row.id), "You left the project");
    if (result) onLeft();
    return !!result;
  };

  const remove = async () => !!(await run(() => removeMemberAction(row.id), "Member removed"));

  return (
    <li className="border-t border-kb-divider py-3">
      <div className="flex items-start gap-3">
        {(() => {
          const avatar = (
            <UserAvatar
              name={name}
              avatarUrl={row.profile?.avatar_url}
              avatarBg={row.profile?.avatar_bg}
              avatarFg={row.profile?.avatar_fg}
              className={cn(pending && "opacity-50")}
            />
          );
          return profileHref ? (
            <Link href={profileHref} tabIndex={-1} aria-hidden className="rounded-full">
              {avatar}
            </Link>
          ) : (
            avatar
          );
        })()}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold [overflow-wrap:anywhere]">
              {profileHref ? (
                <Link href={profileHref} className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  {name}
                </Link>
              ) : (
                name
              )}
              {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
            </span>
            {row.isAdmin && <Badge className="h-5 px-2 text-[11px] font-semibold">Admin</Badge>}
            {pending && (
              <Badge
                variant="outline"
                className="h-5 border-dashed px-2 text-[11px] font-semibold text-muted-foreground"
              >
                Invite pending
              </Badge>
            )}
          </div>
          {row.profile && <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{row.email}</span>}
          <div className="flex flex-wrap items-center gap-1.5">
            {row.roles.map((role) => (
              <RoleChip key={role} role={role} />
            ))}
            {row.roles.length === 0 && <span className="text-xs text-muted-foreground">No role yet</span>}
            {permissions.canEditRoles && <AddRoleButton expanded={rolesOpen} onClick={openRoles} />}
          </div>
        </div>

        {permissions.hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={`Actions for ${name}`}>
                <More size={18} variant="Linear" color="currentColor" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {permissions.canToggleAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () => setMemberAdminAction(row.id, !row.isAdmin),
                        row.isAdmin ? "Admin role removed" : "Made admin",
                      )
                    }
                  >
                    {row.isAdmin ? "Remove Admin" : "Make Admin"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {permissions.canCopyLink && <DropdownMenuItem onClick={copyNewLink}>Copy Invite Link</DropdownMenuItem>}
              {permissions.canRemove && (
                <DropdownMenuItem variant="destructive" onClick={() => setConfirm("remove")}>
                  Remove from Project
                </DropdownMenuItem>
              )}
              {permissions.canCancelInvite && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => run(() => removeMemberAction(row.id), "Invite cancelled")}
                >
                  Cancel Invite
                </DropdownMenuItem>
              )}
              {permissions.canLeave && (
                <DropdownMenuItem variant="destructive" onClick={() => setConfirm("leave")}>
                  Leave Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ConfirmDeleteDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "leave" ? "Leave project?" : "Remove from project?"}
        description={
          confirm === "leave"
            ? `You will lose access to ${projectName} and be taken off all its tasks.`
            : `${name} will lose access to ${projectName} and be taken off all its tasks.`
        }
        confirmLabel={confirm === "leave" ? "Leave Project" : "Remove"}
        onConfirm={confirm === "leave" ? leave : remove}
      />

      {rolesOpen && permissions.canEditRoles && (
        <div className="mt-2">
          <RolePicker roles={draft} onChange={setDraft} onDone={saveRoles} />
        </div>
      )}
    </li>
  );
}
