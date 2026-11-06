-- 006: RLS helper functions + policies

-- ── helpers (private schema, security definer, always scoped to auth.uid()) ──
create or replace function private.my_project_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.project_id
  from public.project_members m
  where m.user_id = (select auth.uid())
    and m.status = 'active';
$$;

create or replace function private.my_admin_project_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.project_id
  from public.project_members m
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.is_admin;
$$;

create or replace function private.my_teammate_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select distinct other.user_id
  from public.project_members me
  join public.project_members other
    on other.project_id = me.project_id
   and other.status = 'active'
   and other.user_id is not null
  where me.user_id = (select auth.uid())
    and me.status = 'active';
$$;

create or replace function private.is_project_member(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.is_project_admin(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.is_admin
  );
$$;

create or replace function private.can_access_task(p_task_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    join public.project_members m on m.project_id = t.project_id
    where t.id = p_task_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.shares_project(p_other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members me
    join public.project_members other on other.project_id = me.project_id
    where me.user_id = (select auth.uid())
      and me.status = 'active'
      and other.user_id = p_other
      and other.status = 'active'
  );
$$;

revoke all on function
  private.my_project_ids(),
  private.my_admin_project_ids(),
  private.my_teammate_ids(),
  private.is_project_member(uuid),
  private.is_project_admin(uuid),
  private.can_access_task(uuid),
  private.shares_project(uuid)
from public, anon;

grant execute on function
  private.my_project_ids(),
  private.my_admin_project_ids(),
  private.my_teammate_ids(),
  private.is_project_member(uuid),
  private.is_project_admin(uuid),
  private.can_access_task(uuid),
  private.shares_project(uuid)
to authenticated, service_role;

-- ── enable RLS everywhere ──
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.categories      enable row level security;
alter table public.tasks           enable row level security;
alter table public.task_assignees  enable row level security;
alter table public.project_pins    enable row level security;

-- ── profiles: self or teammates ──
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or id in (select private.my_teammate_ids()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ── projects ──
create policy projects_select on public.projects
  for select to authenticated
  using (owner_id = (select auth.uid()) or id in (select private.my_project_ids()));

create policy projects_insert on public.projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy projects_update_admin on public.projects
  for update to authenticated
  using (id in (select private.my_admin_project_ids()))
  with check (id in (select private.my_admin_project_ids()));

create policy projects_delete_owner on public.projects
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ── project_members ──
create policy project_members_select on public.project_members
  for select to authenticated
  using (project_id in (select private.my_project_ids()));

create policy project_members_update_admin on public.project_members
  for update to authenticated
  using (project_id in (select private.my_admin_project_ids()))
  with check (project_id in (select private.my_admin_project_ids()));

-- admins remove/cancel anyone (owner blocked by trigger); anyone can leave (delete own row)
create policy project_members_delete on public.project_members
  for delete to authenticated
  using (
    project_id in (select private.my_admin_project_ids())
    or user_id = (select auth.uid())
  );

-- ── categories ──
create policy categories_select on public.categories
  for select to authenticated
  using (project_id in (select private.my_project_ids()));

create policy categories_insert_admin on public.categories
  for insert to authenticated
  with check (project_id in (select private.my_admin_project_ids()));

create policy categories_update_admin on public.categories
  for update to authenticated
  using (project_id in (select private.my_admin_project_ids()))
  with check (project_id in (select private.my_admin_project_ids()));

-- ── tasks ──
create policy tasks_select on public.tasks
  for select to authenticated
  using (project_id in (select private.my_project_ids()));

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (project_id in (select private.my_project_ids()));

create policy tasks_update on public.tasks
  for update to authenticated
  using (project_id in (select private.my_project_ids()))
  with check (project_id in (select private.my_project_ids()));

create policy tasks_delete_admin on public.tasks
  for delete to authenticated
  using (project_id in (select private.my_admin_project_ids()));

-- ── task_assignees ──
create policy task_assignees_select on public.task_assignees
  for select to authenticated
  using (private.can_access_task(task_id));

create policy task_assignees_insert on public.task_assignees
  for insert to authenticated
  with check (private.can_access_task(task_id));

create policy task_assignees_delete on public.task_assignees
  for delete to authenticated
  using (private.can_access_task(task_id));

-- ── project_pins: own rows ──
create policy project_pins_select_own on public.project_pins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy project_pins_insert_own on public.project_pins
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy project_pins_delete_own on public.project_pins
  for delete to authenticated
  using (user_id = (select auth.uid()));
