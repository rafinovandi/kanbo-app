import { redirect } from "next/navigation";

import { hashInviteToken } from "@/lib/invite-token";
import { createClient } from "@/lib/supabase/server";

import InviteExpired from "./invite-expired";
import InviteMismatch from "./invite-mismatch";

// Handles /invite/<token>: sign in first, then accept through accept_invite(), which checks the
// token hash, its expiry and that the signed-in (verified) email is the invited one.
export default async function InviteAccept({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const { data } = await supabase.rpc("accept_invite", { p_token_hash: hashInviteToken(token) });
  const result = data?.[0];

  if (result?.status === "accepted") redirect("/dashboard");

  if (result?.status === "email_mismatch") {
    const signedInEmail = typeof claims.email === "string" ? claims.email : "another account";
    return <InviteMismatch invitedEmail={result.invited_email ?? "another email"} signedInEmail={signedInEmail} />;
  }

  return <InviteExpired />;
}
