import "server-only";

import { randomBytes } from "node:crypto";

import { environment } from "@/configs/environment";
import { clientKey, failure, isApiResult, readJson, type AgentLinkContext, type ApiResult } from "@/lib/agent/http";
import { boardUrl, invalid, text } from "@/lib/agent/shared";
import { createChatToken, hashAgentSecret, normalizeLinkCode } from "@/lib/agent/tokens";
import { createAdminClient } from "@/lib/supabase/admin";

const CHAT_ID = /^-?\d{1,20}$/;

// Trades a one-time code for a chat token. The code is consumed in one UPDATE, so it can only win once.
export async function linkChat(request: Request): Promise<ApiResult> {
  if (!environment.AGENT_ENABLED) return failure(404, "agent_disabled", "Not found");

  const admin = createAdminClient();
  const { data: limit } = await admin.rpc("agent_link_rate_limit", { p_client_hash: clientKey(request) });
  if (!limit?.[0]?.allowed) {
    return failure(429, "rate_limited", "Too many attempts. Try again shortly.", {
      "Retry-After": String(limit?.[0]?.retry_after ?? 60),
    });
  }

  const parsed = await readJson(request);
  if (isApiResult(parsed)) return parsed;
  const code = normalizeLinkCode(text(parsed.data.code, 32));
  const chatId = text(parsed.data.chatId, 64);
  const gone = failure(410, "code_expired", "This code is invalid, expired or already used.");
  if (!code) return invalid("Send { code } (and, for a Telegram chat, channel and chatId).");

  const codeHash = hashAgentSecret("link-code", code);
  const { data: peek } = await admin
    .from("agent_link_codes")
    .select("kind")
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!peek) return gone;
  if (peek.kind === "chat" && (parsed.data.channel !== "telegram" || !CHAT_ID.test(chatId))) {
    return invalid("Send { code, channel: \"telegram\", chatId } with a numeric chatId.");
  }

  const { data: used } = await admin
    .from("agent_link_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("project_id, bot_id, created_by, kind")
    .maybeSingle();
  if (!used) return gone;
  const isChat = used.kind === "chat";

  const [{ data: bot }, { data: stillAdmin }, { data: project }] = await Promise.all([
    used.bot_id
      ? admin.from("agent_bots").select("id").eq("id", used.bot_id).is("revoked_at", null).maybeSingle()
      : Promise.resolve({ data: isChat ? null : { id: "" } }),
    admin
      .from("project_members")
      .select("id")
      .eq("project_id", used.project_id)
      .eq("user_id", used.created_by)
      .eq("status", "active")
      .eq("is_admin", true)
      .maybeSingle(),
    admin.from("projects").select("id, name").eq("id", used.project_id).maybeSingle(),
  ]);
  if (!bot || !stillAdmin || !project) return gone;

  const linkChatId = isChat ? chatId : `mcp-${randomBytes(8).toString("hex")}`;
  const { data: existing } = isChat
    ? await admin
        .from("agent_links")
        .select("id, project_id")
        .eq("channel", "telegram")
        .eq("chat_id", chatId)
        .is("revoked_at", null)
    : { data: [] };
  if (existing?.some((link) => link.project_id !== used.project_id)) {
    return failure(409, "chat_already_linked", "This chat is already connected to another project. Revoke it there first, then generate a new code.");
  }

  const replaced = (existing ?? []).map((link) => link.id);
  if (replaced.length > 0) {
    await admin.from("agent_links").update({ revoked_at: new Date().toISOString() }).in("id", replaced);
  }

  const token = createChatToken();
  const { error } = await admin.from("agent_links").insert({
    project_id: used.project_id,
    bot_id: used.bot_id,
    kind: used.kind,
    channel: "telegram",
    chat_id: linkChatId,
    token_hash: hashAgentSecret("chat-token", token),
    linked_by: used.created_by,
  });
  if (error) {
    if (replaced.length > 0) await admin.from("agent_links").update({ revoked_at: null }).in("id", replaced);
    if (error.code === "23505") {
      return failure(409, "chat_already_linked", "This chat is already connected to another project. Revoke it there first, then generate a new code.");
    }
    return failure(500, "link_failed", "Could not link this chat. Try again with a new code.");
  }

  return { status: 200, body: { token, project: { id: project.id, name: project.name, url: boardUrl(project.id) } } };
}

export async function unlinkChat(ctx: AgentLinkContext): Promise<ApiResult> {
  await ctx.admin.from("agent_links").update({ revoked_at: new Date().toISOString() }).eq("id", ctx.id);
  return { status: 200, body: { revoked: true } };
}
