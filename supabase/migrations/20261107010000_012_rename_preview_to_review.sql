-- 012: the default fourth column is "Review", not "Preview".

alter type public.category_key rename value 'preview' to 'review';

update public.categories set name = 'Review' where key = 'review' and name = 'Preview';

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
    (new.id, 'review',   'Review',      'lilac', 3),
    (new.id, 'done',     'Done',        'green', 4);

  return null;
end;
$$;

create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with my as (
    select m.project_id
    from public.project_members m
    where m.user_id = (select auth.uid()) and m.status = 'active'
  ),
  t as (
    select t.project_id, c.key
    from public.tasks t
    join public.categories c on c.id = t.category_id
    where t.project_id in (select project_id from my)
  )
  select jsonb_build_object(
    'project_count', (select count(*) from my),
    'total',    (select count(*) from t),
    'todo',     (select count(*) from t where key = 'todo'),
    'progress', (select count(*) from t where key = 'progress'),
    'review',   (select count(*) from t where key = 'review'),
    'done',     (select count(*) from t where key = 'done'),
    'other',    (select count(*) from t where key is null),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', pr.id, 'name', pr.name, 'color', pr.color,
               'total', (select count(*) from t where t.project_id = pr.id),
               'done',  (select count(*) from t where t.project_id = pr.id and t.key = 'done')
             ) order by pr.created_at)
      from public.projects pr
      where pr.id in (select project_id from my)
    ), '[]'::jsonb)
  );
$$;
