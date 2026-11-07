-- 013: tasks assigned to the caller that are overdue or due within p_days (the bell in the top bar).
-- SECURITY INVOKER: the existing RLS on tasks, task_assignees, categories and projects still applies.

create or replace function public.my_due_notifications(p_today date, p_days integer default 3)
returns table (
  task_id uuid,
  project_id uuid,
  project_name text,
  project_color public.project_color,
  title text,
  due_date date,
  status_key public.category_key
)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.id, t.project_id, p.name, p.color, t.title, t.due_date, c.key
  from public.tasks t
  join public.task_assignees a on a.task_id = t.id and a.user_id = (select auth.uid())
  join public.categories c on c.id = t.category_id
  join public.projects p on p.id = t.project_id
  where t.due_date is not null
    and t.due_date <= p_today + least(greatest(p_days, 0), 30)
    and c.key is distinct from 'done'
  order by t.due_date, t.title
  limit 50;
$$;

revoke all on function public.my_due_notifications(date, integer) from public, anon;
grant execute on function public.my_due_notifications(date, integer) to authenticated, service_role;
