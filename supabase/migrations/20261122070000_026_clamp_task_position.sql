-- 026: a task position outside the allowed range is clamped instead of rejected.
-- The CHECK from 020 stays as the hard limit. Without the clamp, one member writing a position at the
-- limit through the API makes every later "last position + 1" insert or move in that column fail (23514).

create or replace function private.clamp_task_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new."position" := least(greatest(new."position", -1e15::float8), 1e15::float8);
  return new;
end;
$$;

revoke all on function private.clamp_task_position() from public, anon, authenticated;

create trigger tasks_clamp_position
  before insert or update of "position" on public.tasks
  for each row execute function private.clamp_task_position();
