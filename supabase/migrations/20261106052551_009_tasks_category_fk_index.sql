-- 009: covering index for the composite FK tasks(category_id, project_id) -> categories(id, project_id)
drop index if exists public.tasks_category_id_idx;
create index tasks_category_project_idx on public.tasks (category_id, project_id);
