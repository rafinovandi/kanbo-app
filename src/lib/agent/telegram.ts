import "server-only";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;

export type TelegramBot = { id: string; username: string };
export type TelegramResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(token: string, method: string, body?: Record<string, unknown>): Promise<TelegramResult<T>> {
  try {
    const response = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const json = (await response.json()) as { ok: boolean; result?: T; description?: string };
    if (!json.ok || json.result === undefined) return { ok: false, error: json.description ?? `HTTP ${response.status}` };
    return { ok: true, data: json.result };
  } catch {
    return { ok: false, error: "Could not reach Telegram" };
  }
}

// Validates a BotFather token and returns the bot's public id and username.
export async function getMe(token: string): Promise<TelegramResult<TelegramBot>> {
  const result = await call<{ id: number; is_bot: boolean; username?: string }>(token, "getMe");
  if (!result.ok) return result;
  if (!result.data.is_bot || !result.data.username) return { ok: false, error: "Not a bot token" };
  return { ok: true, data: { id: String(result.data.id), username: result.data.username } };
}

export async function sendMessage(token: string, chatId: string, html: string): Promise<TelegramResult<null>> {
  const result = await call<unknown>(token, "sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  return result.ok ? { ok: true, data: null } : result;
}

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
