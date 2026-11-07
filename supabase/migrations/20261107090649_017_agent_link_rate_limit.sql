-- 017: brute-force guard for the agent link endpoint (10 attempts per minute per client, keyed by a hashed IP)
create table public.agent_link_attempts (
  client_hash  text not null check (char_length(client_hash) <= 128),
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (client_hash, window_start)
);

alter table public.agent_link_attempts enable row level security;
revoke all on public.agent_link_attempts from anon, authenticated;

create or replace function public.agent_link_rate_limit(p_client_hash text)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  insert into public.agent_link_attempts as r (client_hash, window_start, count)
  values (p_client_hash, v_window, 1)
  on conflict (client_hash, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  allowed := v_count <= 10;
  retry_after := greatest(1, ceil(extract(epoch from (v_window + interval '1 minute' - now())))::integer);
  return next;
end;
$$;

revoke all on function public.agent_link_rate_limit(text) from public, anon, authenticated;
grant execute on function public.agent_link_rate_limit(text) to service_role;

create or replace function public.cleanup_agent_data()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.agent_requests where created_at < now() - interval '24 hours';
  delete from public.agent_rate_limits where window_start < now() - interval '1 hour';
  delete from public.agent_link_attempts where window_start < now() - interval '1 hour';
  delete from public.agent_link_codes where expires_at < now() - interval '1 day';
  delete from public.notification_log where created_at < now() - interval '30 days';
$$;
