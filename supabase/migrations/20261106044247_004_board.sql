-- 004: categories (columns), tasks, assignees, pins

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  key        public.category_key,  -- null = custom column
  name       text not null check (char_length(btrim(name)) between 1 and 24),
  color      public.project_color not null default 'gray',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_id_project_key unique (id, project_id)
);

create unique index categories_project_name_key on public.categories (project_id, lower(btrim(name)));
create unique index categories_project_key_key  on public.categories (project_id, key) where key is not null;
create index categories_project_position_idx    on public.categories (project_id, position);

create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  category_id    uuid not null,
  title          text not null check (char_length(btrim(title)) between 1 and 200),
  description    text not null default '' check (char_length(description) <= 20000),
  priority       public.task_priority not null default 'medium',
  due_date       date,
  position       double precision not null default 0,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz,  -- maintained by trigger set_completed_at
  source         public.task_source not null default 'web',
  source_channel text check (char_length(source_channel) <= 32),
  source_sender  text check (char_length(source_sender) <= 64),
  -- a task's column must belong to the same project
  constraint tasks_category_same_project_fk
    foreign key (category_id, project_id) references public.categories (id, project_id)
);

create index tasks_project_category_position_idx on public.tasks (project_id, category_id, position);
create index tasks_category_id_idx               on public.tasks (category_id);
create index tasks_created_by_idx                on public.tasks (created_by);
create index tasks_completed_at_idx              on public.tasks (completed_at) where completed_at is not null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function private.set_updated_at();

create table public.task_assignees (
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index task_assignees_user_id_idx on public.task_assignees (user_id);

create table public.project_pins (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  pinned_at  timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index project_pins_project_id_idx on public.project_pins (project_id);

-- privileges
revoke all on public.categories from anon, authenticated;
grant select on public.categories to authenticated;
grant insert (project_id, name, color, position) on public.categories to authenticated;
grant update (name, color, position) on public.categories to authenticated;
-- delete only through delete_category() (moves tasks first)

revoke all on public.tasks from anon, authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (project_id, category_id, title, description, priority, due_date, position) on public.tasks to authenticated;
grant update (category_id, title, description, priority, due_date, position) on public.tasks to authenticated;

revoke all on public.task_assignees from anon, authenticated;
grant select, delete on public.task_assignees to authenticated;
grant insert (task_id, user_id) on public.task_assignees to authenticated;

revoke all on public.project_pins from anon, authenticated;
grant select, delete on public.project_pins to authenticated;
grant insert (project_id) on public.project_pins to authenticated;
