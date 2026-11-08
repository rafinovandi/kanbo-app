-- 020: hardening from the run-2 security audit.
-- Stricter data rules (finite task positions, avatar URLs, colours, role/email lengths) and a few
-- race and disclosure fixes. Every ALTER below fails loudly if existing rows break a new rule.

-- ── tasks.position must be finite and bounded (NaN sorts above every number, so the range excludes it) ──
alter table public.tasks
  add constraint tasks_position_finite check ("position" between -1e15 and 1e15);

-- ── avatar colours and lengths that users can write directly through PostgREST ──
alter table public.profiles
  add constraint profiles_avatar_bg_hex check (avatar_bg ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint profiles_avatar_fg_hex check (avatar_fg ~ '^#[0-9A-Fa-f]{6}$');

alter table public.project_members
  add constraint project_members_roles_length check (char_length(array_to_string(roles, ',')) <= 619),
  add constraint project_members_email_length check (char_length(email::text) <= 254);

-- ── avatar_url: Google picture, or exactly <own folder>/<uuid>.png|jpg in this project's bucket ──
update public.profiles p
set avatar_url = null
where p.avatar_url is not null
  and p.avatar_url !~ '^https://lh[0-9]\.googleusercontent\.com/[^[:space:]]*$'
  and not exists (
    select 1 from private.app_config c
    where c.key = 'supabase_host'
      and starts_with(p.avatar_url, 'https://' || c.value || '/storage/v1/object/public/avatars/' || p.id::text || '/')
      and substr(p.avatar_url, char_length('https://' || c.value || '/storage/v1/object/public/avatars/' || p.id::text || '/') + 1)
          ~ '^[0-9a-f-]{36}\.(png|jpg)$'
  );

create or replace function private.validate_avatar_url()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host   text;
  v_prefix text;
begin
  if new.avatar_url is null then
    return new;
  end if;

  if new.avatar_url ~ '^https://lh[0-9]\.googleusercontent\.com/[^[:space:]]*$' then
    return new;
  end if;

  select c.value into v_host from private.app_config c where c.key = 'supabase_host';

  if v_host is not null then
    v_prefix := 'https://' || v_host || '/storage/v1/object/public/avatars/' || new.id::text || '/';
    if starts_with(new.avatar_url, v_prefix)
       and substr(new.avatar_url, char_length(v_prefix) + 1) ~ '^[0-9a-f-]{36}\.(png|jpg)$' then
      return new;
    end if;
  end if;

  raise exception 'Avatar must be an uploaded photo' using errcode = '22023';
end;
$$;

-- ── pins: serialise per user so concurrent inserts cannot pass the limit of 3 ──
create or replace function private.limit_pins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if not exists (
    select 1 from public.project_members m
    where m.project_id = new.project_id
      and m.user_id = new.user_id
      and m.status = 'active'
  ) then
    raise exception 'You can only pin projects you are an active member of' using errcode = 'P0001';
  end if;

  if (select count(*) from public.project_pins pp where pp.user_id = new.user_id) >= 3 then
    raise exception 'You can pin up to 3 projects' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- ── delete_category: one error for "missing" and "not allowed", and lock the project so two admins cannot both pass the last-column guard ──
create or replace function public.delete_category(p_category_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c        public.categories%rowtype;
  v_target uuid;
  v_max    double precision;
begin
  select * into c from public.categories where id = p_category_id;
  if not found then
    raise exception 'Only project admins can delete categories' using errcode = '42501';
  end if;

  if auth.uid() is null or not private.is_project_admin(c.project_id) then
    raise exception 'Only project admins can delete categories' using errcode = '42501';
  end if;

  perform 1 from public.projects p where p.id = c.project_id for update;

  if c.key = 'done' then
    raise exception 'The Done category cannot be deleted' using errcode = 'P0001';
  end if;

  select x.id into v_target
  from public.categories x
  where x.project_id = c.project_id and x.id <> c.id
    and (x.position, x.created_at) > (c.position, c.created_at)
  order by x.position, x.created_at
  limit 1;

  if v_target is null then
    select x.id into v_target
    from public.categories x
    where x.project_id = c.project_id and x.id <> c.id
    order by x.position desc, x.created_at desc
    limit 1;
  end if;

  if v_target is null then
    raise exception 'A project needs at least one category' using errcode = 'P0001';
  end if;

  select coalesce(max(t.position), 0) into v_max from public.tasks t where t.category_id = v_target;

  update public.tasks t
  set category_id = v_target,
      position    = v_max + s.rn
  from (
    select id, row_number() over (order by position, created_at) as rn
    from public.tasks
    where category_id = c.id
  ) s
  where t.id = s.id;

  delete from public.categories where id = c.id;
  return v_target;
end;
$$;

-- ── bot token hint: keep only the public bot id prefix, never a character of the secret ──
create or replace function public.set_agent_bot_token(p_bot_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_hint text := left(p_token, 4) || '...';
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

update public.agent_bots
set token_hint = left(token_hint, 4) || '...'
where token_hint is not null;
