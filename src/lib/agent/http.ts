import "server-only";

import { NextResponse } from "next/server";

import { environment } from "@/configs/environment";
import { displayClientName } from "@/lib/agent/client-name";
import { hashAgentSecret, CHAT_TOKEN_PREFIX } from "@/lib/agent/tokens";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminClient = ReturnType<typeof createAdminClient>;
// `agentLabel` is who created the tasks of this link: the bot's name for a Telegram chat, the client's name for MCP.
export type AgentLinkContext = {
  id: string;
  projectId: string;
  linkedBy: string;
  kind: "chat" | "mcp";
  clientName: string | null;
  agentLabel: string;
  admin: AdminClient;
};
export type ApiResult = { status: number; body: unknown; headers?: Record<string, string> };

const MAX_BODY_BYTES = 400_000;

export const reply = ({ status, body, headers }: ApiResult) => NextResponse.json(body, { status, headers });

export const failure = (status: number, error: string, message: string, headers?: Record<string, string>): ApiResult => ({
  status,
  body: { error, message },
  headers,
});

const disabled = () => failure(404, "agent_disabled", "Not found");

// Reads the body without buffering more than the limit; null means it was too large.
export async function readBodyText(request: Request, maxBytes = MAX_BODY_BYTES): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

// Reads a JSON object from the request; anything else is a 422.
export async function readJson(request: Request): Promise<{ raw: string; data: Record<string, unknown> } | ApiResult> {
  const raw = await readBodyText(request);
  if (raw === null) return failure(422, "validation_failed", "The request body is too large.");
  try {
    const data: unknown = raw ? JSON.parse(raw) : {};
    if (typeof data === "object" && data !== null && !Array.isArray(data)) return { raw, data: data as Record<string, unknown> };
  } catch {}
  return failure(422, "validation_failed", "The request body must be a JSON object.");
}

export const isApiResult = (value: object): value is ApiResult => "status" in value && "body" in value;

// Who is calling, from the Authorization header alone. The project always comes from the token
// (never from anything the agent sends), and every authenticated call counts toward the rate limit.
export async function authenticate(request: Request): Promise<AgentLinkContext | ApiResult> {
  if (!environment.AGENT_ENABLED) return disabled();

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token.startsWith(CHAT_TOKEN_PREFIX) || token.length > 128) return failure(401, "unauthorized", "Invalid or revoked token.");

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("agent_links")
    .select("id, project_id, linked_by, kind, client_name, agent_bots(name)")
    .eq("token_hash", hashAgentSecret("chat-token", token))
    .is("revoked_at", null)
    .maybeSingle();
  if (!link) return failure(401, "unauthorized", "Invalid or revoked token.");

  const { data: stillAdmin } = await admin
    .from("project_members")
    .select("id")
    .eq("project_id", link.project_id)
    .eq("user_id", link.linked_by)
    .eq("status", "active")
    .eq("is_admin", true)
    .maybeSingle();
  if (!stillAdmin) return failure(401, "unauthorized", "Invalid or revoked token.");

  const { data: limit } = await admin.rpc("agent_rate_limit", { p_token_id: link.id });
  const verdict = limit?.[0];
  if (!verdict || !verdict.allowed) {
    return failure(429, "rate_limited", "Too many requests. Try again shortly.", { "Retry-After": String(verdict?.retry_after ?? 60) });
  }

  await admin.from("agent_links").update({ last_used_at: new Date().toISOString() }).eq("id", link.id);
  const kind = link.kind === "mcp" ? "mcp" : "chat";
  const agentLabel = (kind === "mcp" ? displayClientName(link.client_name) : link.agent_bots?.name) ?? "Agent";
  return { id: link.id, projectId: link.project_id, linkedBy: link.linked_by, kind, clientName: link.client_name, agentLabel, admin };
}

export async function withAuth(request: Request, handler: (ctx: AgentLinkContext) => Promise<ApiResult>) {
  const auth = await authenticate(request);
  return reply(isApiResult(auth) ? auth : await handler(auth));
}

// The caller's address, hashed so no raw IP is stored. A client can put its own entries at the front of
// x-forwarded-for but cannot change the last one, which the proxy in front of the app writes.
export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = request.headers.get("x-vercel-forwarded-for")?.trim() || forwarded || request.headers.get("x-real-ip") || "unknown";
  return hashAgentSecret("client-ip", ip);
}
