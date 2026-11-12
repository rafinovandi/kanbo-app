import "server-only";

import { environment } from "@/configs/environment";
import { INVITE_TTL_DAYS } from "@/constants/project-constant";
import { createInviteToken, hashInviteToken } from "@/lib/invite-token";
import { sendInviteEmail } from "@/lib/send-invite-email";
import type { createClient } from "@/lib/supabase/server";
import type { InviteDraft } from "@/validations/project";

export type Supabase = Awaited<ReturnType<typeof createClient>>;

async function emailInvite(
  supabase: Supabase,
  to: string,
  projectId: string,
  link: string,
) {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const [project, inviter] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).maybeSingle(),
    userId
      ? supabase.from("profiles").select("name").eq("id", userId).maybeSingle()
      : null,
  ]);

  await sendInviteEmail({
    to,
    link,
    projectName: project.data?.name ?? "a project",
    inviterName: inviter?.data?.name ?? "A teammate",
  });
}

// Creates (or renews) the pending member through invite_member() (admin-only, checked in the
// database) and returns the accept link to share, or null when it could not be created. Calling it
// again for a pending email issues a new token, so the old link stops working.
export async function inviteMember(
  supabase: Supabase,
  invite: InviteDraft,
  projectId: string,
) {
  try {
    const token = createInviteToken();
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await supabase.rpc("invite_member", {
      p_project_id: projectId,
      p_email: invite.email,
      p_roles: invite.roles,
      p_token_hash: hashInviteToken(token),
      p_expires_at: expiresAt,
    });
    if (error) return null;

    const link = `${environment.APP_URL}/invite/${token}`;
    await emailInvite(supabase, invite.email, projectId, link);
    return link;
  } catch (error) {
    console.error(
      "Invite failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
