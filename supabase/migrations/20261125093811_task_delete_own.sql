-- 028: a member can delete the tasks they created; admins can still delete any task of their project.

drop policy if exists tasks_delete_admin on public.tasks;

create policy tasks_delete on public.tasks
  for delete to authenticated
  using (
    project_id in (select private.my_admin_project_ids())
    or (
      created_by = (select auth.uid())
      and project_id in (select private.my_project_ids())
    )
  );
