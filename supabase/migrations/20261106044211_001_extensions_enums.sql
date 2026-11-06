-- 001: extensions, private schema, enums, shared helpers

create extension if not exists citext with schema extensions;

-- private schema: helper functions + internal tables, NOT exposed through the Data API
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create type public.project_color as enum ('gray', 'blue', 'lilac', 'pink', 'orange', 'green');
create type public.category_key  as enum ('todo', 'progress', 'preview', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.member_status as enum ('pending', 'active');
create type public.task_source   as enum ('web', 'agent');

-- generic updated_at trigger
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
