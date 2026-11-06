-- 003: projects, members, invite tokens

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  description text not null default '' check (char_length(description) <= 500),
  color       public.project_color not null default 'gray',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.projects.owner_id is 'Creator of the project. Permanent admin; cannot be removed or leave.';

create index projects_owner_id_idx on public.projects (owner_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

create table public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete cascade,  -- null while pending
  email       extensions.citext not null,
  status      public.member_status not null default 'pending',
  is_admin    boolean not null default false,
  roles       text[] not null default '{}' check (cardinality(roles) <= 20),
  invited_by  uuid references public.profiles (id) on delete set null,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  constraint project_members_project_email_key unique (project_id, email),
  constraint project_members_project_user_key  unique (project_id, user_id),
  constraint project_members_active_has_user   check (status = 'pending' or user_id is not null)
);

create index project_members_user_id_idx        on public.project_members (user_id);
create index project_members_invited_by_idx     on public.project_members (invited_by);
create index project_members_project_status_idx on public.project_members (project_id, status);
create index project_members_email_pending_idx  on public.project_members (email) where status = 'pending';

-- invite tokens live in the private schema so members can never read the hashes
create table private.member_invite_tokens (
  member_id  uuid primary key references public.project_members (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) >= 32),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table private.member_invite_tokens enable row level security;
revoke all on private.member_invite_tokens from public, anon, authenticated;

-- privileges
revoke all on public.projects from anon, authenticated;
grant select, insert, delete on public.projects to authenticated;
grant update (name, description, color) on public.projects to authenticated;

revoke all on public.project_members from anon, authenticated;
grant select, delete on public.project_members to authenticated;
grant update (roles, is_admin) on public.project_members to authenticated;
-- inserts happen only through on_project_created (owner) and invite_member() (RPC)
