import "server-only";

const RESEND_URL = "https://api.resend.com/emails";

// Email clients can't read CSS variables, so these mirror the light-theme tokens in globals.css.
const COLORS = {
  background: "#ffffff",
  foreground: "#111318",
  muted: "#5b5f6b",
  border: "#e7e8ec",
  primary: "#111318",
  primaryForeground: "#ffffff",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type InviteEmail = {
  to: string;
  link: string;
  projectName: string;
  inviterName: string;
};

// Sends the invite link through Resend. Resolves false when Resend isn't configured or the send
// fails, so the caller can fall back to the link the admin copies by hand.
export async function sendInviteEmail({
  to,
  link,
  projectName,
  inviterName,
}: InviteEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return false;

  const project = escapeHtml(projectName);
  const inviter = escapeHtml(inviterName);
  const href = escapeHtml(link);

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${COLORS.background};color:${COLORS.foreground};max-width:480px;margin:0 auto;padding:32px 24px">
  <h1 style="font-size:20px;margin:0 0 12px">You're invited to ${project}</h1>
  <p style="font-size:15px;line-height:1.5;color:${COLORS.muted};margin:0 0 24px">${inviter} invited you to join <strong style="color:${COLORS.foreground}">${project}</strong> on Kanbo.</p>
  <a href="${href}" style="display:inline-block;background:${COLORS.primary};color:${COLORS.primaryForeground};text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px">Accept Invite</a>
  <p style="font-size:13px;line-height:1.5;color:${COLORS.muted};margin:24px 0 0;padding-top:16px;border-top:1px solid ${COLORS.border}">Or open this link: <a href="${href}" style="color:${COLORS.muted}">${href}</a></p>
</div>`;

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `${inviterName} invited you to ${projectName} on Kanbo`,
        html,
      }),
    });
    if (!response.ok) console.error("Invite email failed:", response.status);
    return response.ok;
  } catch (error) {
    console.error(
      "Invite email failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
