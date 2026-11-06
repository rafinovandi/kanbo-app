-- 002: profiles + auto-create on first sign-in

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             extensions.citext not null unique,
  name              text not null check (char_length(btrim(name)) between 1 and 80),
  username          text not null unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  avatar_url        text check (char_length(avatar_url) <= 1000),
  avatar_bg         text not null default '#EEF2FF',
  avatar_fg         text not null default '#4338CA',
  headline          text check (char_length(headline) <= 60),
  bio               text check (char_length(bio) <= 160),
  location          text check (char_length(location) <= 80),
  website           text check (char_length(website) <= 200),
  telegram_username text check (telegram_username ~ '^[A-Za-z0-9_]{5,32}$'),
  timezone          text not null default 'Asia/Jakarta' check (char_length(timezone) <= 64),
  show_stats        boolean not null default true,
  show_activity     boolean not null default true,
  show_pinned       boolean not null default true,
  show_recent_tasks boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Public profile per auth user. Created by trigger on_auth_user_created.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- privileges: read + update of editable columns only (email / id are read-only)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  name, username, avatar_url, avatar_bg, avatar_fg, headline, bio, location, website,
  telegram_username, timezone, show_stats, show_activity, show_pinned, show_recent_tasks
) on public.profiles to authenticated;

-- create the profile when a user signs in for the first time (Google OAuth)
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email    text  := lower(coalesce(nullif(new.email, ''), new.id::text || '@users.noreply.kanbo'));
  v_name     text;
  v_base     text;
  v_username text;
  v_i        int   := 0;
  v_tones    text[] := array[
    '#EEF2FF', '#4338CA',
    '#ECFDF5', '#047857',
    '#FDF2F8', '#BE185D',
    '#FFF7ED', '#C2410C',
    '#F5F3FF', '#6D28D9',
    '#EFF6FF', '#1D4ED8'
  ];
  v_t        int;
begin
  v_name := nullif(btrim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), '');
  if v_name is null then
    v_name := split_part(v_email, '@', 1);
  end if;
  v_name := left(coalesce(nullif(v_name, ''), 'User'), 80);

  v_base := left(regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9_-]', '', 'g'), 24);
  if char_length(v_base) < 3 then
    v_base := 'user' || v_base;
  end if;

  v_username := v_base;
  while exists (select 1 from public.profiles p where p.username = v_username) loop
    v_i := v_i + 1;
    v_username := v_base || v_i::text;
  end loop;

  v_t := floor(random() * 6)::int; -- 0..5

  insert into public.profiles (id, email, name, username, avatar_url, avatar_bg, avatar_fg)
  values (
    new.id,
    v_email,
    v_name,
    v_username,
    coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture'),
    v_tones[v_t * 2 + 1],
    v_tones[v_t * 2 + 2]
  );

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
