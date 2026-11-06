-- 010: security hardening (audit findings 1-4)
--  1. invites only match a *verified* auth email
--  2. profiles.avatar_url restricted to our avatars bucket / Google profile pictures
--  3. profiles.website restricted to http(s) links
--  4. project_members.roles elements validated on every write (not only in invite_member)

-- ── 1. verified email helper ──
-- profiles.email is copied from auth.users at sign-up without checking confirmation, so invite
-- matching must read the confirmed email from auth.users instead.
create or replace function private.my_verified_email()
returns text
language sql stable security definer set search_path = ''
as $$
  select u.email::text
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null;
$$;

revoke all on function private.my_verified_email() from public, anon;
grant execute on function private.my_verified_email() to authenticated, service_role;

create or replace function public.accept_invite(p_token_hash text)
returns table (status text, project_id uuid, invited_email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  r       record;
begin
  if v_uid is null then
    return query select 'unauthenticated'::text, null::uuid, null::text;
    return;
  end if;

  select m.id, m.project_id, m.email::text as email, m.status, t.expires_at
  into r
  from private.member_invite_tokens t
  join public.project_members m on m.id = t.member_id
  where t.token_hash = p_token_hash;

  if not found or r.status <> 'pending' then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if r.expires_at < now() then
    return query select 'expired'::text, r.project_id, null::text;
    return;
  end if;

  v_email := private.my_verified_email();

  -- NULL (unverified email) must fail closed: NULL <> x is NULL, not true
  if v_email is null or lower(v_email) <> lower(r.email) then
    return query select 'email_mismatch'::text, null::uuid, r.email;
    return;
  end if;

  return query select 'accepted'::text, private.activate_membership(r.id, v_uid), null::text;
end;
$$;

create or replace function public.accept_pending_invite(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  v_email := private.my_verified_email();

  if v_email is null or not exists (
    select 1 from public.project_members m
    where m.id = p_member_id and m.status = 'pending' and lower(m.email::text) = lower(v_email)
  ) then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  return private.activate_membership(p_member_id, v_uid);
end;
$$;

create or replace function public.my_pending_invites()
returns table (
  member_id       uuid,
  project_id      uuid,
  project_name    text,
  project_color   public.project_color,
  invited_by_name text,
  invited_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, pr.id, pr.name, pr.color, inv.name, m.invited_at
  from public.project_members m
  join public.projects pr on pr.id = m.project_id
  left join public.profiles inv on inv.id = m.invited_by
  where m.status = 'pending'
    and lower(m.email::text) = lower(private.my_verified_email())
  order by m.invited_at desc;
$$;

-- create or replace keeps existing grants, but restate them so this migration is self-contained
revoke all on function
  public.accept_invite(text),
  public.accept_pending_invite(uuid),
  public.my_pending_invites()
from public, anon;

grant execute on function
  public.accept_invite(text),
  public.accept_pending_invite(uuid),
  public.my_pending_invites()
to authenticated, service_role;

-- ── 2. avatar_url origin ──
-- Allowed: the user's own folder in this project's public avatars bucket, or the Google profile
-- picture that handle_new_user() sets. The Supabase host is NOT hardcoded (this repo is open source):
-- each deployment stores its own host once in private.app_config, outside version control:
--
--   insert into private.app_config (key, value)
--   values ('supabase_host', '<project-ref>.supabase.co')
--   on conflict (key) do update set value = excluded.value;
--
-- Until it is set, only Google profile pictures are accepted (fail closed).
create table if not exists private.app_config (
  key   text primary key,
  value text not null
);

alter table private.app_config enable row level security;
revoke all on private.app_config from public, anon, authenticated;

create or replace function private.validate_avatar_url()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host text;
begin
  if new.avatar_url is null then
    return new;
  end if;

  if new.avatar_url ~ '^https://lh[0-9]\.googleusercontent\.com/' then
    return new;
  end if;

  select c.value into v_host from private.app_config c where c.key = 'supabase_host';

  if v_host is not null
     and starts_with(new.avatar_url, 'https://' || v_host || '/storage/v1/object/public/avatars/' || new.id::text || '/') then
    return new;
  end if;

  raise exception 'Avatar must be an uploaded photo' using errcode = '22023';
end;
$$;

create trigger profiles_validate_avatar_url
  before insert or update of avatar_url on public.profiles
  for each row execute function private.validate_avatar_url();

revoke all on function private.validate_avatar_url() from public, anon, authenticated;

-- ── 3. website scheme ──
update public.profiles
set website = null
where website is not null and website !~* '^https?://';

alter table public.profiles
  add constraint profiles_website_scheme
  check (website is null or website ~* '^https?://');

-- ── 4. roles element validation ──
-- same rule as invite_member(): 1-30 characters per role (the column already caps the count at 20)
create or replace function private.validate_member_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from unnest(new.roles) r
    where r is null or char_length(btrim(r)) not between 1 and 30
  ) then
    raise exception 'Roles must be 1-30 characters (max 20 roles)' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger project_members_validate_roles
  before insert or update of roles on public.project_members
  for each row execute function private.validate_member_roles();

revoke all on function private.validate_member_roles() from public, anon, authenticated;
