export type AgentBot = {
  id: string;
  name: string;
  bot_username: string;
  token_hint: string | null;
  created_at: string;
};

export type AgentLinkKind = "chat" | "mcp";

export type NotifyKey = "notify_task_created" | "notify_task_completed";

export type AgentLink = {
  id: string;
  kind: AgentLinkKind;
  chat_id: string;
  client_name: string | null;
  bot_username: string | null;
  last_used_at: string | null;
  created_at: string;
  notify_task_created: boolean;
  notify_task_completed: boolean;
  notify_disabled_reason: string | null;
};
