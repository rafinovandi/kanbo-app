"use server";

import { revalidatePath } from "next/cache";

import { ROLE_LIMITS } from "@/constants/project-constant";
import { inviteMember } from "@/lib/invite-member";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, isValidRole, normalizeRoles } from "@/validations/project";

export type MemberActionResult = { status: "success"; link?: string } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "You don't have permission to do that.";
const FAILED = "Something went wrong. Try again.";

const fail = (message: string): MemberActionResult => ({ status: "error", message });

// The caller's Supabase client, or null when the session is gone. Every rule (admin only, creator
// protected, no self-promotion) is enforced by RLS and triggers; these actions only report the result.
async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

// Trigger errors (P0001/22023) carry a readable message; anything else stays generic.
const messageFor = (error: { code?: string; message: string }) =>
  error.code === "P0001" || error.code === "22023" ? error.message : FAILED;

function done(link?: string): MemberActionResult {
  revalidatePath("/", "layout");
  return { status: "success", link };
}

export async function inviteMemberAction(projectId: string, email: string): Promise<MemberActionResult> {
  const address = email.trim().toLowerCase();
  if (!UUID.test(projectId) || !isValidEmail(address)) return fail("Enter a valid email address.");

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { link, message } = await inviteMember(supabase, { email: address, roles: [] }, projectId);
  return link ? done(link) : fail(message ?? "Could not invite this email. They may already be a member.");
}

// Issues a new link for a pending invite (the old one stops working).
export async function resendInviteAction(memberId: string): Promise<MemberActionResult> {
  if (!UUID.test(memberId)) return fail(FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data: member } = await supabase
    .from("project_members")
    .select("project_id, email, roles, status")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.status !== "pending") return fail("This invite no longer exists.");

  const { link, message } = await inviteMember(supabase, { email: member.email, roles: member.roles }, member.project_id);
  return link ? done(link) : fail(message ?? NOT_ALLOWED);
}

export async function updateMemberRolesAction(memberId: string, roles: string[]): Promise<MemberActionResult> {
  const clean = normalizeRoles(roles);
  if (!UUID.test(memberId) || clean.length > ROLE_LIMITS.maxRoles || !clean.every(isValidRole)) {
    return fail(`Roles must be 1-${ROLE_LIMITS.maxLength} characters (max ${ROLE_LIMITS.maxRoles} roles).`);
  }

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data, error } = await supabase.from("project_members").update({ roles: clean }).eq("id", memberId).select("id");
  if (error) return fail(messageFor(error));
  return data.length > 0 ? done() : fail(NOT_ALLOWED);
}

export async function setMemberAdminAction(memberId: string, isAdmin: boolean): Promise<MemberActionResult> {
  if (!UUID.test(memberId)) return fail(FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data, error } = await supabase.from("project_members").update({ is_admin: isAdmin }).eq("id", memberId).select("id");
  if (error) return fail(messageFor(error));
  return data.length > 0 ? done() : fail(NOT_ALLOWED);
}

// Removes a member, cancels a pending invite, or (on your own row) leaves the project.
export async function removeMemberAction(memberId: string): Promise<MemberActionResult> {
  if (!UUID.test(memberId)) return fail(FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data, error } = await supabase.from("project_members").delete().eq("id", memberId).select("id");
  if (error) return fail(messageFor(error));
  return data.length > 0 ? done() : fail(NOT_ALLOWED);
}
