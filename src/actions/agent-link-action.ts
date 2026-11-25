"use server";

import { environment } from "@/configs/environment";
import { createMcpLink } from "@/lib/agent/link-service";
import { escapeHtml, sendMessage } from "@/lib/agent/telegram";
import { hashAgentSecret, createLinkCode } from "@/lib/agent/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AgentLink, AgentLinkKind } from "@/types/agent";

type Failure = { status: "error"; message: string };
export type AgentLinkActionResult = { status: "success" } | Failure;
export type LinkCodeResult =
  | { status: "success"; code: string; expiresAt: string }
  | Failure;
export type McpLinkResult =
  | { status: "success"; token: string; linkId: string }
  | Failure;
export type AgentLinksResult =
  | { status: "success"; links: AgentLink[] }
  | Failure;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "You don't have permission to do that.";
const FAILED = "Something went wrong. Try again.";
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_LINKS_PER_MEMBER = 5;

const fail = (message: string): Failure => ({ status: "error", message });

// The agent tables have no RLS policies (service role only), so every action here first proves the
// caller is an active member of the project, then talks to the database with the admin client.
// Members manage only the links they made; admins manage every link of the project.
async function getMemberSession(projectId: string) {
  if (!environment.AGENT_ENABLED || !UUID.test(projectId)) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: member } = await supabase
    .from("project_members")
    .select("is_admin")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) return null;

  return {
    supabase,
    userId,
    isAdmin: member.is_admin,
    admin: createAdminClient(),
  };
}

type MemberSession = NonNullable<Awaited<ReturnType<typeof getMemberSession>>>;

// An MCP link that was never used is replaced by the next one, so it does not count.
async function linkLimitReached(session: MemberSession, projectId: string) {
  const { count } = await session.admin
    .from("agent_links")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("linked_by", session.userId)
    .is("revoked_at", null)
    .or("kind.eq.chat,last_used_at.not.is.null");
  return (count ?? 0) >= MAX_LINKS_PER_MEMBER;
}

const LIMIT_REACHED = `You can have up to ${MAX_LINKS_PER_MEMBER} connections in this project. Revoke one first.`;

async function canManageLink(
  session: MemberSession,
  projectId: string,
  linkId: string,
) {
  if (session.isAdmin) return true;
  const { data } = await session.admin
    .from("agent_links")
    .select("id")
    .eq("id", linkId)
    .eq("project_id", projectId)
    .eq("linked_by", session.userId)
    .maybeSingle();
  return !!data;
}

// One-time code for linking a Telegram chat (needs one of your bots) or an MCP client (needs no bot).
// Only the hash is stored, so the code exists in plain text only in this reply.
export async function createLinkCodeAction(
  projectId: string,
  kind: AgentLinkKind,
  botId?: string,
): Promise<LinkCodeResult> {
  if (kind !== "chat" && kind !== "mcp") return fail(FAILED);
  const chatBotId = kind === "chat" && botId && UUID.test(botId) ? botId : null;
  if (kind === "chat" && !chatBotId) return fail(FAILED);

  const session = await getMemberSession(projectId);
  if (!session) return fail(NOT_ALLOWED);
  if (await linkLimitReached(session, projectId)) return fail(LIMIT_REACHED);

  if (chatBotId) {
    const { data: bot } = await session.supabase
      .from("agent_bots")
      .select("id")
      .eq("id", chatBotId)
      .is("revoked_at", null)
      .maybeSingle();
    if (!bot) return fail("Choose one of your bots.");
  }

  await session.admin
    .from("agent_link_codes")
    .delete()
    .eq("project_id", projectId)
    .eq("created_by", session.userId)
    .is("used_at", null);

  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = createLinkCode();
    const { error } = await session.admin.from("agent_link_codes").insert({
      code_hash: hashAgentSecret("link-code", code),
      project_id: projectId,
      bot_id: chatBotId,
      kind,
      created_by: session.userId,
      expires_at: expiresAt,
    });
    if (!error) return { status: "success", code, expiresAt };
    if (error.code !== "23505") break;
  }
  return fail(FAILED);
}

// The MCP token is created right away and shown once, so the client only has to run `claude mcp add`.
export async function createMcpLinkAction(
  projectId: string,
): Promise<McpLinkResult> {
  const session = await getMemberSession(projectId);
  if (!session) return fail(NOT_ALLOWED);
  if (await linkLimitReached(session, projectId)) return fail(LIMIT_REACHED);

  const link = await createMcpLink(session.admin, projectId, session.userId);
  if (!link) return fail(FAILED);
  return { status: "success", ...link };
}

export async function listAgentLinksAction(
  projectId: string,
): Promise<AgentLinksResult> {
  const session = await getMemberSession(projectId);
  if (!session) return fail(NOT_ALLOWED);

  let query = session.admin
    .from("agent_links")
    .select(
      "id, kind, chat_id, client_name, linked_by, last_used_at, created_at, notify_task_created, notify_task_completed, notify_disabled_reason, agent_bots(bot_username), profiles!agent_links_linked_by_fkey(name)",
    )
    .eq("project_id", projectId)
    .is("revoked_at", null);
  if (!session.isAdmin) query = query.eq("linked_by", session.userId);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) return fail(FAILED);

  return {
    status: "success",
    links: data.map((row) => ({
      id: row.id,
      kind: row.kind === "mcp" ? "mcp" : "chat",
      chat_id: row.chat_id,
      client_name: row.client_name,
      bot_username: row.agent_bots?.bot_username ?? null,
      linked_by_name: row.profiles?.name ?? null,
      mine: row.linked_by === session.userId,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      notify_task_created: row.notify_task_created,
      notify_task_completed: row.notify_task_completed,
      notify_disabled_reason: row.notify_disabled_reason,
    })),
  };
}

export async function updateLinkNotifyAction(
  projectId: string,
  linkId: string,
  patch: { notify_task_created?: boolean; notify_task_completed?: boolean },
): Promise<AgentLinkActionResult> {
  if (!UUID.test(linkId)) return fail(FAILED);

  const session = await getMemberSession(projectId);
  if (!session || !(await canManageLink(session, projectId, linkId)))
    return fail(NOT_ALLOWED);

  const update: {
    notify_task_created?: boolean;
    notify_task_completed?: boolean;
    notify_disabled_reason?: null;
  } = {};
  if (typeof patch.notify_task_created === "boolean")
    update.notify_task_created = patch.notify_task_created;
  if (typeof patch.notify_task_completed === "boolean")
    update.notify_task_completed = patch.notify_task_completed;
  if (Object.keys(update).length === 0) return fail(FAILED);
  if (update.notify_task_created || update.notify_task_completed)
    update.notify_disabled_reason = null;

  const { data, error } = await session.admin
    .from("agent_links")
    .update(update)
    .eq("id", linkId)
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .select("id");
  if (error || data.length === 0) return fail(FAILED);
  return { status: "success" };
}

export async function sendTestMessageAction(
  projectId: string,
  linkId: string,
): Promise<AgentLinkActionResult> {
  if (!UUID.test(linkId)) return fail(FAILED);

  const session = await getMemberSession(projectId);
  if (!session || !(await canManageLink(session, projectId, linkId)))
    return fail(NOT_ALLOWED);

  const [{ data: link }, { data: project }] = await Promise.all([
    session.admin
      .from("agent_links")
      .select("kind, bot_id, chat_id")
      .eq("id", linkId)
      .eq("project_id", projectId)
      .is("revoked_at", null)
      .maybeSingle(),
    session.admin.from("projects").select("name").eq("id", projectId).single(),
  ]);
  if (!link) return fail(FAILED);
  if (link.kind !== "chat" || !link.bot_id)
    return fail("Test messages are only for Telegram chats.");

  const { data: token } = await session.admin.rpc("get_agent_bot_token", {
    p_bot_id: link.bot_id,
  });
  if (!token) return fail("The bot token is not available. Add the bot again.");

  const result = await sendMessage(
    token,
    link.chat_id,
    `✅ <b>Kanbo is connected</b> to ${escapeHtml(project?.name ?? "this project")}. Updates will appear here.`,
  );
  if (!result.ok) return fail(`Telegram refused the message: ${result.error}`);
  return { status: "success" };
}

export async function revokeLinkAction(
  projectId: string,
  linkId: string,
): Promise<AgentLinkActionResult> {
  if (!UUID.test(linkId)) return fail(FAILED);

  const session = await getMemberSession(projectId);
  if (!session || !(await canManageLink(session, projectId, linkId)))
    return fail(NOT_ALLOWED);

  const { data, error } = await session.admin
    .from("agent_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .select("id");
  if (error || data.length === 0) return fail(FAILED);
  return { status: "success" };
}
