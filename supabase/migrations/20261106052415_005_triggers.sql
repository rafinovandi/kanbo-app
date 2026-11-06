-- 005: business-rule triggers

-- New project: owner becomes an active admin member + seed the 4 built-in columns
create or replace function private.on_project_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, email, status, is_admin, invited_by, accepted_at)
  select new.id, p.id, p.email, 'active', true, p.id, now()
  from public.profiles p
  where p.id = new.owner_id;

  insert into public.categories (project_id, key, name, color, position) values
    (new.id, 'todo',     'To Do',       'gray',  1),
    (new.id, 'progress', 'In Progress', 'blue',  2),
    (new.id, 'preview',  'Preview',     'lilac', 3),
    (new.id, 'done',     'Done',        'green', 4);

  return null;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function private.on_project_created();

-- completed_at: set when a task enters the 'done' column, cleared when it leaves
create or replace function private.set_completed_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_done boolean;
begin
  if tg_op = 'UPDATE' and new.category_id is not distinct from old.category_id then
    return new;
  end if;

  select c.key = 'done' into v_is_done
  from public.categories c
  where c.id = new.category_id;

  if coalesce(v_is_done, false) then
    new.completed_at := now();
  else
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger tasks_set_completed_at
  before insert or update of category_id on public.tasks
  for each row execute function private.set_completed_at();

-- Category delete guard: never delete 'done' or the last column (unless the whole project is being deleted)
create or replace function private.guard_category_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.projects p where p.id = old.project_id) then
    return old; -- project cascade delete
  end if;

  if old.key = 'done' then
    raise exception 'The Done category cannot be deleted' using errcode = 'P0001';
  end if;

  if (select count(*) from public.categories c where c.project_id = old.project_id) <= 1 then
    raise exception 'A project needs at least one category' using errcode = 'P0001';
  end if;

  return old;
end;
$$;

create trigger categories_guard_delete
  before delete on public.categories
  for each row execute function private.guard_category_delete();

-- Assignees must be ACTIVE members of the task's project
create or replace function private.guard_assignee_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.tasks t
    join public.project_members m on m.project_id = t.project_id
    where t.id = new.task_id
      and m.user_id = new.user_id
      and m.status = 'active'
  ) then
    raise exception 'Only active members of this project can be assigned' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger task_assignees_guard_active
  before insert or update on public.task_assignees
  for each row execute function private.guard_assignee_active();

-- Member removed / left: drop their assignments and pins in that project
create or replace function private.on_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.user_id is not null then
    delete from public.task_assignees ta
    using public.tasks t
    where ta.task_id = t.id
      and t.project_id = old.project_id
      and ta.user_id = old.user_id;

    delete from public.project_pins pp
    where pp.project_id = old.project_id
      and pp.user_id = old.user_id;
  end if;
  return null;
end;
$$;

create trigger project_members_on_removed
  after delete on public.project_members
  for each row execute function private.on_member_removed();

-- Owner protection + no self admin toggling
create or replace function private.protect_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_uid   uuid := auth.uid();
begin
  select p.owner_id into v_owner from public.projects p where p.id = old.project_id;

  if v_owner is null then
    -- project is being deleted (cascade)
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.user_id = v_owner
       and exists (select 1 from public.profiles pr where pr.id = old.user_id) then
      raise exception 'The project owner cannot be removed or leave the project' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.user_id = v_owner and (
       new.is_admin is distinct from true
       or new.status <> 'active'
       or new.user_id is distinct from old.user_id
     ) then
    raise exception 'The project owner must stay an active admin' using errcode = 'P0001';
  end if;

  if v_uid is not null
     and old.user_id = v_uid
     and new.is_admin is distinct from old.is_admin then
    raise exception 'You cannot change your own admin role' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger project_members_protect_owner
  before update or delete on public.project_members
  for each row execute function private.protect_owner();

-- Pins: active members only, max 4 per user
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

  if (select count(*) from public.project_pins pp where pp.user_id = new.user_id) >= 4 then
    raise exception 'You can pin up to 4 projects' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger project_pins_limit
  before insert on public.project_pins
  for each row execute function private.limit_pins();

-- trigger functions are never called directly
revoke all on function
  private.on_project_created(),
  private.set_completed_at(),
  private.guard_category_delete(),
  private.guard_assignee_active(),
  private.on_member_removed(),
  private.protect_owner(),
  private.limit_pins(),
  private.set_updated_at()
from public, anon, authenticated;
