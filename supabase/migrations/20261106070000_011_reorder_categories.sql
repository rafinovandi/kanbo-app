-- 011: admins reorder a project's board columns in one atomic step.
-- categories.position is an integer, so the whole list is renumbered 1..n instead of inserting
-- a fractional value between two neighbours.

create or replace function public.reorder_categories(p_project_id uuid, p_category_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_project_admin(p_project_id) then
    raise exception 'Only project admins can reorder categories' using errcode = '42501';
  end if;

  -- the list must be exactly the project's categories, each once
  if p_category_ids is null
     or cardinality(p_category_ids) <> (select count(distinct x) from unnest(p_category_ids) x)
     or cardinality(p_category_ids) <> (select count(*) from public.categories c where c.project_id = p_project_id)
     or exists (
       select 1 from unnest(p_category_ids) x
       where not exists (select 1 from public.categories c where c.id = x and c.project_id = p_project_id)
     )
  then
    raise exception 'The list must contain every category of the project exactly once' using errcode = '22023';
  end if;

  update public.categories c
  set position = s.ord::int
  from unnest(p_category_ids) with ordinality as s(id, ord)
  where c.id = s.id;
end;
$$;

revoke all on function public.reorder_categories(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_categories(uuid, uuid[]) to authenticated, service_role;
