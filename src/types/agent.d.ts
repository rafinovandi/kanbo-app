export type AgentBot = {
  id: string;
  name: string;
  bot_username: string;
  token_hint: string | null;
  created_at: string;
};

export type AgentLink = {
  id: string;
  chat_id: string;
  bot_username: string;
  last_used_at: string | null;
  created_at: string;
  notify_task_created: boolean;
  notify_task_completed: boolean;
  notify_disabled_reason: string | null;
};
