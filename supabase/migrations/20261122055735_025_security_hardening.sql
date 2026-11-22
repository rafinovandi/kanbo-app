-- 025: security hardening from the database audit.
-- A Telegram handle can belong to one profile only, so nobody can claim another person's @mention.
-- New tables and functions in public are no longer granted to anon by default.

create unique index profiles_telegram_username_key
  on public.profiles (lower(telegram_username));

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;
