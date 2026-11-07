-- 014: tells a signed-in user whether a project id is theirs ('member'), exists but is private to others
-- ('forbidden', the 403 page) or does not exist ('missing', the 404 page). RLS hides projects from non-members,
-- so this needs SECURITY DEFINER; it reveals nothing beyond whether that (unguessable) id exists.

create or replace function public.project_access(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then 'missing'
    when p_project_id in (select private.my_project_ids()) then 'member'
    when exists (select 1 from public.projects where id = p_project_id) then 'forbidden'
    else 'missing'
  end;
$$;

revoke all on function public.project_access(uuid) from public, anon;
grant execute on function public.project_access(uuid) to authenticated, service_role;
