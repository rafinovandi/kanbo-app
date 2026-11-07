-- 016: any project admin can delete the project (was: owner only)

drop policy projects_delete_owner on public.projects;

create policy projects_delete_admin on public.projects
  for delete to authenticated
  using (id in (select private.my_admin_project_ids()));
