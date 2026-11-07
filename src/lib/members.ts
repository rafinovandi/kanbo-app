import type { MemberRow } from "@/types/project";

export type MemberPermissions = {
  canEditRoles: boolean;
  canToggleAdmin: boolean;
  canRemove: boolean;
  canCancelInvite: boolean;
  canCopyLink: boolean;
  canLeave: boolean;
  hasMenu: boolean;
};

// What the signed-in user may do on one row (spec §3, §8). The database enforces the same rules;
// this only decides which actions to show.
export function getMemberPermissions({
  meId,
  iAmAdmin,
  ownerId,
  row,
}: {
  meId: string;
  iAmAdmin: boolean;
  ownerId: string;
  row: MemberRow;
}): MemberPermissions {
  const isCreator = row.userId !== null && row.userId === ownerId;
  const isSelf = row.userId !== null && row.userId === meId;
  const pending = row.status === "pending";
  const onOther = iAmAdmin && !isSelf && !isCreator;

  const permissions = {
    canEditRoles: iAmAdmin,
    canToggleAdmin: onOther && !pending,
    canRemove: onOther && !pending,
    canCancelInvite: onOther && pending,
    canCopyLink: onOther && pending,
    canLeave: isSelf && !isCreator,
  };
  return { ...permissions, hasMenu: Object.entries(permissions).some(([key, value]) => key !== "canEditRoles" && value) };
}
