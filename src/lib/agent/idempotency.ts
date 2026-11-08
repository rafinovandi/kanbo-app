import "server-only";

import { createHash } from "node:crypto";

import { failure, type AgentLinkContext, type ApiResult } from "@/lib/agent/http";

const hashPayload = (scope: string, raw: string) => createHash("sha256").update(`${scope}\n${raw}`).digest("hex");

const PENDING_STATUS = 0;
const STALE_PENDING_MS = 2 * 60 * 1000;

// Real (non-dry-run) writes need an Idempotency-Key. The key is claimed before the handler runs, so two
// concurrent requests cannot both write. A retry with the same key and body replays the first answer; the
// same key with another body or another target is a conflict. `scope` names the operation and its target.
export async function runIdempotent(
  ctx: AgentLinkContext,
  request: Request,
  scope: string,
  raw: string,
  handler: () => Promise<ApiResult>,
): Promise<ApiResult> {
  const key = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!key || key.length > 128) {
    return failure(422, "idempotency_key_required", "Send an Idempotency-Key header (1 to 128 characters) when saving.");
  }

  const payloadHash = hashPayload(scope, raw);
  const row = { token_id: ctx.id, idempotency_key: key };
  const { error: claimError } = await ctx.admin
    .from("agent_requests")
    .insert({ ...row, payload_hash: payloadHash, response_status: PENDING_STATUS, response_body: null });

  if (claimError) {
    if (claimError.code !== "23505") return failure(500, "idempotency_failed", "Could not record this request. Try again.");
    const { data: previous } = await ctx.admin
      .from("agent_requests")
      .select("payload_hash, response_status, response_body, created_at")
      .match(row)
      .maybeSingle();
    if (!previous) return failure(409, "idempotency_in_progress", "Try again shortly.", { "Retry-After": "1" });
    if (previous.payload_hash !== payloadHash) {
      return failure(409, "idempotency_conflict", "This Idempotency-Key was already used with a different request.");
    }
    if (previous.response_status === PENDING_STATUS) {
      if (Date.now() - new Date(previous.created_at).getTime() > STALE_PENDING_MS) {
        await ctx.admin.from("agent_requests").delete().match(row).eq("response_status", PENDING_STATUS);
      }
      return failure(409, "idempotency_in_progress", "The first request with this Idempotency-Key is still running. Try again shortly.", {
        "Retry-After": "1",
      });
    }
    return { status: previous.response_status, body: previous.response_body, headers: { "Idempotent-Replay": "true" } };
  }

  let result: ApiResult;
  try {
    result = await handler();
  } catch (error) {
    await ctx.admin.from("agent_requests").delete().match(row);
    throw error;
  }

  if (result.status >= 200 && result.status < 300) {
    await ctx.admin
      .from("agent_requests")
      .update({ response_status: result.status, response_body: result.body as never })
      .match(row);
  } else {
    await ctx.admin.from("agent_requests").delete().match(row);
  }
  return result;
}
