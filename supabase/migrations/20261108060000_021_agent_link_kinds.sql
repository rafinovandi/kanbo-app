-- 021: a link is either a Telegram chat ('chat') or an MCP client ('mcp').
-- An MCP link talks to the API directly, so it needs no bot and has no real chat.

alter table public.agent_link_codes
  add column kind text not null default 'chat' check (kind in ('chat', 'mcp'));
alter table public.agent_link_codes
  alter column bot_id drop not null;
alter table public.agent_link_codes
  add constraint agent_link_codes_bot_for_chat check (kind = 'mcp' or bot_id is not null);

alter table public.agent_links
  add column kind text not null default 'chat' check (kind in ('chat', 'mcp'));
alter table public.agent_links
  alter column bot_id drop not null;
alter table public.agent_links
  add constraint agent_links_bot_for_chat check (kind = 'mcp' or bot_id is not null);

-- Revoke by who linked, not by bot ownership, so links without a bot also end when their admin is demoted or removed.
create or replace function private.revoke_links_on_admin_lost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.user_id is null then
    return null;
  end if;

  update public.agent_links l
  set revoked_at = now()
  where l.project_id = old.project_id
    and l.revoked_at is null
    and l.linked_by = old.user_id;

  delete from public.agent_link_codes c
  where c.project_id = old.project_id
    and c.created_by = old.user_id
    and c.used_at is null;

  return null;
end;
$$;
