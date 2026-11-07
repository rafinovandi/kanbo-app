"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AcceptInviteResult = { status: "success" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accepts an invite shown in the dashboard banner. The database checks that the invite is for the
// signed-in user's verified email (accept_pending_invite).
export async function acceptPendingInviteAction(memberId: string): Promise<AcceptInviteResult> {
  if (!UUID.test(memberId)) return { status: "error", message: "This invite is no longer available." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { status: "error", message: "Your session expired. Sign in again." };

  const { error } = await supabase.rpc("accept_pending_invite", { p_member_id: memberId });
  if (error) {
    return {
      status: "error",
      message: error.code === "P0002" ? "This invite is no longer available." : "Could not accept the invite. Try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
