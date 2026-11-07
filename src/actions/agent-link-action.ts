"use server";

import { environment } from "@/configs/environment";
import { hashAgentSecret, createLinkCode } from "@/lib/agent/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AgentLink } from "@/types/agent";

type Failure = { status: "error"; message: string };
export type AgentLinkActionResult = { status: "success" } | Failure;
export type LinkCodeResult = { status: "success"; code: string; expiresAt: string } | Failure;
export type AgentLinksResult = { status: "success"; links: AgentLink[] } | Failure;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "You don't have permission to do that.";
const FAILED = "Something went wrong. Try again.";
const CODE_TTL_MS = 10 * 60 * 1000;

const fail = (message: string): Failure => ({ status: "error", message });

// The agent tables have no RLS policies (service role only), so every action here first proves the
// caller is an active admin of the project, then talks to the database with the admin client.
async function getAdminSession(projectId: string) {
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
  if (!member?.is_admin) return null;

  return { supabase, userId, admin: createAdminClient() };
}

// One-time code for linking a chat. Only the hash is stored, so the code exists in plain text only in this reply.
export async function createLinkCodeAction(projectId: string, botId: string): Promise<LinkCodeResult> {
  if (!UUID.test(botId)) return fail(FAILED);

  const session = await getAdminSession(projectId);
  if (!session) return fail(NOT_ALLOWED);

  const { data: bot } = await session.supabase
    .from("agent_bots")
    .select("id")
    .eq("id", botId)
    .is("revoked_at", null)
    .maybeSingle();
  if (!bot) return fail("Choose one of your bots.");

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
      bot_id: botId,
      created_by: session.userId,
      expires_at: expiresAt,
    });
    if (!error) return { status: "success", code, expiresAt };
    if (error.code !== "23505") break;
  }
  return fail(FAILED);
}

export async function listAgentLinksAction(projectId: string): Promise<AgentLinksResult> {
  const session = await getAdminSession(projectId);
  if (!session) return fail(NOT_ALLOWED);

  const { data, error } = await session.admin
    .from("agent_links")
    .select(
      "id, chat_id, last_used_at, created_at, notify_task_created, notify_task_completed, notify_disabled_reason, agent_bots(bot_username)",
    )
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: true });
  if (error) return fail(FAILED);

  return {
    status: "success",
    links: data.map((row) => ({
      id: row.id,
      chat_id: row.chat_id,
      bot_username: row.agent_bots?.bot_username ?? "",
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

  const session = await getAdminSession(projectId);
  if (!session) return fail(NOT_ALLOWED);

  const update: { notify_task_created?: boolean; notify_task_completed?: boolean; notify_disabled_reason?: null } = {};
  if (typeof patch.notify_task_created === "boolean") update.notify_task_created = patch.notify_task_created;
  if (typeof patch.notify_task_completed === "boolean") update.notify_task_completed = patch.notify_task_completed;
  if (Object.keys(update).length === 0) return fail(FAILED);
  if (update.notify_task_created || update.notify_task_completed) update.notify_disabled_reason = null;

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

export async function revokeLinkAction(projectId: string, linkId: string): Promise<AgentLinkActionResult> {
  if (!UUID.test(linkId)) return fail(FAILED);

  const session = await getAdminSession(projectId);
  if (!session) return fail(NOT_ALLOWED);

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
