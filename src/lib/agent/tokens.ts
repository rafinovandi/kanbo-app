import "server-only";

import { createHmac, randomBytes, randomInt } from "node:crypto";

// No 0/O/1/I/L so a code read out loud or typed from a screenshot is hard to get wrong.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export const CHAT_TOKEN_PREFIX = "kbo_";

export function createChatToken() {
  return `${CHAT_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function createLinkCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export function normalizeLinkCode(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

// Chat tokens and link codes are stored only as these hashes. The purpose prefix keeps the two (and
// invite tokens, see lib/invite-token.ts) from ever matching each other.
export function hashAgentSecret(purpose: "chat-token" | "link-code" | "client-ip", value: string) {
  const pepper = process.env.TOKEN_HASH_PEPPER;
  if (!pepper) throw new Error("TOKEN_HASH_PEPPER is not set");
  return createHmac("sha256", pepper).update(`${purpose}:${value}`).digest("hex");
}
