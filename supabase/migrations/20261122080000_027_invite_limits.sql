-- 027: limits on invite emails.
-- Re-inviting a pending email waits 1 hour. New emails are capped per user per day (the day resets at
-- 00:00 Asia/Jakarta, a fixed zone so changing the profile timezone cannot reset the count).
-- Every new email is logged, so removing a pending member does not give the quota back.

create table private.invite_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create index invite_log_user_created_idx on private.invite_log (user_id, created_at);

alter table private.invite_log enable row level security;
revoke all on table private.invite_log from public, anon, authenticated;

create or replace function public.invite_member(
  p_project_id uuid,
  p_email text,
  p_roles text[],
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := auth.uid();
  v_email       text := lower(btrim(coalesce(p_email, '')));
  v_member      public.project_members%rowtype;
  v_roles       text[] := coalesce(p_roles, '{}');
  v_daily_limit constant int := 20;
  v_day_start   timestamptz := date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  if v_uid is null or not private.is_project_admin(p_project_id) then
    raise exception 'Only project admins can invite people' using errcode = '42501';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;

  if cardinality(v_roles) > 20
     or exists (select 1 from unnest(v_roles) r where char_length(btrim(r)) not between 1 and 30) then
    raise exception 'Roles must be 1-30 characters (max 20 roles)' using errcode = '22023';
  end if;

  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'Invalid invite token' using errcode = '22023';
  end if;

  select * into v_member
  from public.project_members m
  where m.project_id = p_project_id and lower(m.email::text) = v_email;

  if found and v_member.status = 'active' then
    raise exception 'This person is already a member of the project' using errcode = '23505';
  end if;

  if found then
    if v_member.invited_at > now() - interval '1 hour' then
      raise exception 'This person was invited less than an hour ago. Try again later.' using errcode = 'P0001';
    end if;

    update public.project_members
    set roles = v_roles, invited_by = v_uid, invited_at = now()
    where id = v_member.id;
  else
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

    delete from private.invite_log where user_id = v_uid and created_at < now() - interval '2 days';

    if (select count(*) from private.invite_log where user_id = v_uid and created_at >= v_day_start) >= v_daily_limit then
      raise exception 'You can invite up to 20 new people per day. Try again tomorrow.' using errcode = 'P0001';
    end if;

    insert into public.project_members (project_id, email, status, is_admin, roles, invited_by)
    values (p_project_id, v_email, 'pending', false, v_roles, v_uid)
    returning * into v_member;

    insert into private.invite_log (user_id, email) values (v_uid, v_email);
  end if;

  insert into private.member_invite_tokens (member_id, token_hash, expires_at)
  values (v_member.id, p_token_hash, least(coalesce(p_expires_at, now() + interval '7 days'), now() + interval '30 days'))
  on conflict (member_id) do update
    set token_hash = excluded.token_hash,
        expires_at = excluded.expires_at,
        created_at = now();

  return v_member.id;
end;
$$;
