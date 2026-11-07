import "server-only";

import { createHmac, randomBytes } from "node:crypto";

export function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

// The database stores only this hash, never the token (see invite_member / accept_invite).
export function hashInviteToken(token: string) {
  const pepper = process.env.TOKEN_HASH_PEPPER;
  if (!pepper) throw new Error("TOKEN_HASH_PEPPER is not set");
  return createHmac("sha256", pepper).update(token).digest("hex");
}
