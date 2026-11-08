-- Pins: max 3 per user (was 4). Existing pins are kept; only new pins are limited.
create or replace function private.limit_pins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
