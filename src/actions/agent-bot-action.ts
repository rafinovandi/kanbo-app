"use server";

import { environment } from "@/configs/environment";
import { getMe } from "@/lib/agent/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AgentBotActionResult = { status: "success" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_FORMAT = /^\d{5,20}:[A-Za-z0-9_-]{30,}$/;
const NAME_MAX = 40;
const FAILED = "Something went wrong. Try again.";

const fail = (message: string): AgentBotActionResult => ({ status: "error", message });

async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

// Registers a Telegram bot for the signed-in user. The token is checked against Telegram first and
// then lives only in Vault; it is never stored in agent_bots and never sent back to the browser.
export async function addAgentBotAction(token: string, name: string): Promise<AgentBotActionResult> {
  if (!environment.AGENT_ENABLED) return fail("The agent integration is turned off.");

  const botToken = token.trim();
  if (!TOKEN_FORMAT.test(botToken)) return fail("That doesn't look like a BotFather token.");

  const session = await getSession();
  if (!session) return fail("Your session expired. Sign in again.");

  const bot = await getMe(botToken);
  if (!bot.ok) return fail("Telegram rejected this token. Check it and try again.");

  const label = name.trim().slice(0, NAME_MAX) || bot.data.username;
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("agent_bots")
    .insert({ owner_id: session.userId, name: label, channel: "telegram", bot_id: bot.data.id, bot_username: bot.data.username })
    .select("id")
    .single();
  if (error?.code === "23505") return fail(`@${bot.data.username} is already added.`);
  if (error || !row) return fail(FAILED);

  const { error: vaultError } = await admin.rpc("set_agent_bot_token", { p_bot_id: row.id, p_token: botToken });
  if (vaultError) {
    await admin.from("agent_bots").delete().eq("id", row.id);
    return fail(FAILED);
  }

  return { status: "success" };
}

// Deleting the row (own rows only, by RLS) removes its links through the cascade and its Vault secret through a trigger.
export async function removeAgentBotAction(botId: string): Promise<AgentBotActionResult> {
  if (!UUID.test(botId)) return fail(FAILED);

  const session = await getSession();
  if (!session) return fail("Your session expired. Sign in again.");

  const { data, error } = await session.supabase.from("agent_bots").delete().eq("id", botId).select("id");
  if (error || data.length === 0) return fail(FAILED);
  return { status: "success" };
}
