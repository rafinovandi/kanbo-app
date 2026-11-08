-- 023: one Telegram chat can be linked to several projects (one active link per chat and project).

drop index public.agent_links_chat_active_uidx;

create unique index agent_links_chat_project_active_uidx
  on public.agent_links (channel, chat_id, project_id) where revoked_at is null;
