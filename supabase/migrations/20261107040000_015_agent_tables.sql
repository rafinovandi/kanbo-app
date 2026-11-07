-- 015: agent & notifications (bring-your-own bot per user)
-- Bot tokens live in Supabase Vault; chat tokens and link codes are stored as HMAC hashes.
-- Everything is service-role only, except agent_bots (an owner can read and delete their own rows).

create type public.notify_status as enum ('sent', 'failed', 'skipped');

-- ── agent_bots ──
create table public.agent_bots (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 40),
  channel      text not null default 'telegram' check (channel in ('telegram')),
  bot_id       text not null check (bot_id ~ '^[0-9]{1,20}$'),
  bot_username text not null check (char_length(bot_username) between 1 and 64),
  secret_id    uuid references vault.secrets (id) on delete set null,
  token_hint   text check (char_length(token_hint) <= 32),
  created_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  unique (id, owner_id)
);

comment on column public.agent_bots.bot_id is 'Public numeric Telegram bot id (from getMe).';
comment on column public.agent_bots.secret_id is 'Bot token in vault.secrets. The token itself never lives in this table.';

create index agent_bots_owner_id_idx on public.agent_bots (owner_id);
create unique index agent_bots_owner_bot_active_uidx
  on public.agent_bots (owner_id, channel, bot_id) where revoked_at is null;

-- ── agent_link_codes: 8-char single-use codes, valid 10 minutes ──
create table public.agent_link_codes (
  code_hash  text primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  bot_id     uuid not null,
  created_by uuid not null,
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at    timestamptz,
  -- the bot must belong to the admin who creates the code
  foreign key (bot_id, created_by) references public.agent_bots (id, owner_id) on delete cascade
);

create index agent_link_codes_project_id_idx on public.agent_link_codes (project_id);
create index agent_link_codes_bot_creator_idx on public.agent_link_codes (bot_id, created_by);

-- ── agent_links: a chat linked to a project; the chat token is the credential ──
create table public.agent_links (
  id                     uuid primary key default gen_random_uuid(),
  project_id             uuid not null references public.projects (id) on delete cascade,
  bot_id                 uuid not null references public.agent_bots (id) on delete cascade,
  channel                text not null default 'telegram' check (channel in ('telegram')),
  chat_id                text not null check (char_length(chat_id) between 1 and 64),
  token_hash             text not null unique,
  linked_by              uuid not null references public.profiles (id) on delete cascade,
  created_at             timestamptz not null default now(),
  last_used_at           timestamptz,
  revoked_at             timestamptz,
  notify_task_created    boolean not null default true,
  notify_task_completed  boolean not null default true,
  notify_disabled_reason text check (char_length(notify_disabled_reason) <= 200)
);

create unique index agent_links_chat_active_uidx
  on public.agent_links (channel, chat_id) where revoked_at is null;
create index agent_links_project_id_idx on public.agent_links (project_id);
create index agent_links_bot_id_idx on public.agent_links (bot_id);
create index agent_links_linked_by_idx on public.agent_links (linked_by);

-- ── agent_requests: idempotency, kept 24 hours ──
create table public.agent_requests (
  token_id        uuid not null references public.agent_links (id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 128),
  payload_hash    text not null,
  response_status integer not null,
  response_body   jsonb,
  created_at      timestamptz not null default now(),
  primary key (token_id, idempotency_key)
);

create index agent_requests_created_at_idx on public.agent_requests (created_at);

-- ── agent_rate_limits: fixed 1-minute window, max 60 ──
create table public.agent_rate_limits (
  token_id     uuid not null references public.agent_links (id) on delete cascade,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (token_id, window_start)
);

-- ── notification_log: what was sent to which chat, deduped for 10 minutes ──
create table public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  link_id    uuid not null references public.agent_links (id) on delete cascade,
  task_id    uuid not null references public.tasks (id) on delete cascade,
  event      text not null check (event in ('task.created', 'task.completed')),
  status     public.notify_status not null,
  error      text check (char_length(error) <= 500),
  created_at timestamptz not null default now()
);

create index notification_log_dedupe_idx on public.notification_log (link_id, task_id, event, created_at desc);
create index notification_log_task_id_idx on public.notification_log (task_id);

-- ── RLS ──
alter table public.agent_bots        enable row level security;
alter table public.agent_link_codes  enable row level security;
alter table public.agent_links       enable row level security;
alter table public.agent_requests    enable row level security;
alter table public.agent_rate_limits enable row level security;
alter table public.notification_log  enable row level security;

revoke all on
  public.agent_bots, public.agent_link_codes, public.agent_links,
  public.agent_requests, public.agent_rate_limits, public.notification_log
from anon, authenticated;

-- owners read and delete their own bots; insert/update only through server actions (service role)
grant select, delete on public.agent_bots to authenticated;

create policy agent_bots_select_own on public.agent_bots
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy agent_bots_delete_own on public.agent_bots
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ── revoke links when an admin loses admin rights or leaves the project ──
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
    and l.bot_id in (select b.id from public.agent_bots b where b.owner_id = old.user_id);

  delete from public.agent_link_codes c
  where c.project_id = old.project_id
    and c.created_by = old.user_id
    and c.used_at is null;

  return null;
end;
$$;

create trigger project_members_revoke_links_on_demote
  after update of is_admin on public.project_members
  for each row
  when (old.is_admin and not new.is_admin)
  execute function private.revoke_links_on_admin_lost();

create trigger project_members_revoke_links_on_removed
  after delete on public.project_members
  for each row
  when (old.is_admin)
  execute function private.revoke_links_on_admin_lost();

-- ── revoke links and drop the Vault secret when a bot is revoked or deleted ──
create or replace function private.revoke_links_on_bot_revoked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    update public.agent_links
    set revoked_at = now()
    where bot_id = new.id and revoked_at is null;

    delete from public.agent_link_codes where bot_id = new.id and used_at is null;
  end if;

  if old.secret_id is not null then
    delete from vault.secrets where id = old.secret_id;
  end if;

  return null;
end;
$$;

create trigger agent_bots_revoke_links_on_revoked
  after update of revoked_at on public.agent_bots
  for each row
  when (old.revoked_at is null and new.revoked_at is not null)
  execute function private.revoke_links_on_bot_revoked();

create trigger agent_bots_revoke_links_on_deleted
  after delete on public.agent_bots
  for each row execute function private.revoke_links_on_bot_revoked();

revoke all on function
  private.revoke_links_on_admin_lost(),
  private.revoke_links_on_bot_revoked()
from public, anon, authenticated;

-- ── RPC: service role only ──
create or replace function public.set_agent_bot_token(p_bot_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_hint text := left(p_token, 4) || '...' || right(p_token, 3);
begin
  if p_token is null or char_length(p_token) < 20 then
    raise exception 'invalid token' using errcode = '22023';
  end if;

  select secret_id into v_secret_id
  from public.agent_bots
  where id = p_bot_id and revoked_at is null
  for update;

  if not found then
    raise exception 'bot not found' using errcode = 'P0002';
  end if;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_token, 'agent_bot_' || p_bot_id::text, 'Telegram bot token');
  else
    perform vault.update_secret(v_secret_id, p_token);
  end if;

  update public.agent_bots
  set secret_id = v_secret_id, token_hint = v_hint
  where id = p_bot_id;
end;
$$;

create or replace function public.get_agent_bot_token(p_bot_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.decrypted_secret
  from public.agent_bots b
  join vault.decrypted_secrets s on s.id = b.secret_id
  where b.id = p_bot_id and b.revoked_at is null;
$$;

-- counts one request in the current minute window; allowed = false once past 60
create or replace function public.agent_rate_limit(p_token_id uuid)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  insert into public.agent_rate_limits as r (token_id, window_start, count)
  values (p_token_id, v_window, 1)
  on conflict (token_id, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  allowed := v_count <= 60;
  retry_after := greatest(1, ceil(extract(epoch from (v_window + interval '1 minute' - now())))::integer);
  return next;
end;
$$;

-- housekeeping: call from a scheduled job
create or replace function public.cleanup_agent_data()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.agent_requests where created_at < now() - interval '24 hours';
  delete from public.agent_rate_limits where window_start < now() - interval '1 hour';
  delete from public.agent_link_codes where expires_at < now() - interval '1 day';
  delete from public.notification_log where created_at < now() - interval '30 days';
$$;

revoke all on function
  public.set_agent_bot_token(uuid, text),
  public.get_agent_bot_token(uuid),
  public.agent_rate_limit(uuid),
  public.cleanup_agent_data()
from public, anon, authenticated;

grant execute on function
  public.set_agent_bot_token(uuid, text),
  public.get_agent_bot_token(uuid),
  public.agent_rate_limit(uuid),
  public.cleanup_agent_data()
to service_role;
