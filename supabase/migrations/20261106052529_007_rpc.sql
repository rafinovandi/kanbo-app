-- 007: RPC functions (exposed via supabase.rpc). All check auth.uid() internally.

-- ── Invite (or re-invite) a person by email. Admin only. ──
-- p_token_hash = HMAC-SHA256(token, TOKEN_HASH_PEPPER) computed on the server.
create or replace function public.invite_member(
  p_project_id uuid,
  p_email      text,
  p_roles      text[],
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_member public.project_members%rowtype;
  v_roles  text[] := coalesce(p_roles, '{}');
begin
  if v_uid is null or not private.is_project_admin(p_project_id) then
    raise exception 'Only project admins can invite people' using errcode = '42501';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;

  if cardinality(v_roles) > 20
     or exists (select 1 from unnest(v_roles) r where char_length(btrim(r)) not between 1 and 30) then
    raise exception 'Roles must be 1-30 characters (max 20 roles)' using errcode = '22023';
  end if;

  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'Invalid invite token' using errcode = '22023';
  end if;

  select * into v_member
  from public.project_members m
  where m.project_id = p_project_id and lower(m.email::text) = v_email;

  if found and v_member.status = 'active' then
    raise exception 'This person is already a member of the project' using errcode = '23505';
  end if;

  if not found then
    insert into public.project_members (project_id, email, status, is_admin, roles, invited_by)
    values (p_project_id, v_email, 'pending', false, v_roles, v_uid)
    returning * into v_member;
  else
    update public.project_members
    set roles = v_roles, invited_by = v_uid, invited_at = now()
    where id = v_member.id;
  end if;

  insert into private.member_invite_tokens (member_id, token_hash, expires_at)
  values (v_member.id, p_token_hash, least(coalesce(p_expires_at, now() + interval '7 days'), now() + interval '30 days'))
  on conflict (member_id) do update
    set token_hash = excluded.token_hash,
        expires_at = excluded.expires_at,
        created_at = now();

  return v_member.id;
end;
$$;

-- shared accept logic (private): activates a pending row for the current user
create or replace function private.activate_membership(p_member_id uuid, p_uid uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  select m.project_id into v_project from public.project_members m where m.id = p_member_id;

  if exists (
    select 1 from public.project_members m
    where m.project_id = v_project and m.user_id = p_uid and m.id <> p_member_id
  ) then
    -- already a member through another row: drop the duplicate invite
    delete from public.project_members where id = p_member_id;
  else
    update public.project_members
    set status = 'active', user_id = p_uid, accepted_at = now()
    where id = p_member_id;
  end if;

  delete from private.member_invite_tokens where member_id = p_member_id;
  return v_project;
end;
$$;

-- ── Accept an invite from the /invite/<token> link ──
-- status: accepted | already_member | not_found (also used/cancelled) | expired | email_mismatch | unauthenticated
create or replace function public.accept_invite(p_token_hash text)
returns table (status text, project_id uuid, invited_email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  r       record;
begin
  if v_uid is null then
    return query select 'unauthenticated'::text, null::uuid, null::text;
    return;
  end if;

  select m.id, m.project_id, m.email::text as email, m.status, t.expires_at
  into r
  from private.member_invite_tokens t
  join public.project_members m on m.id = t.member_id
  where t.token_hash = p_token_hash;

  if not found or r.status <> 'pending' then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if r.expires_at < now() then
    return query select 'expired'::text, r.project_id, null::text;
    return;
  end if;

  select p.email::text into v_email from public.profiles p where p.id = v_uid;

  if lower(v_email) <> lower(r.email) then
    return query select 'email_mismatch'::text, null::uuid, r.email;
    return;
  end if;

  return query select 'accepted'::text, private.activate_membership(r.id, v_uid), null::text;
end;
$$;

-- ── Accept from the Dashboard banner (email already verified by Google sign-in) ──
create or replace function public.accept_pending_invite(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select p.email::text into v_email from public.profiles p where p.id = v_uid;

  if not exists (
    select 1 from public.project_members m
    where m.id = p_member_id and m.status = 'pending' and lower(m.email::text) = lower(v_email)
  ) then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  return private.activate_membership(p_member_id, v_uid);
end;
$$;

-- ── Pending invites for the signed-in user's email (Dashboard banner) ──
create or replace function public.my_pending_invites()
returns table (
  member_id       uuid,
  project_id      uuid,
  project_name    text,
  project_color   public.project_color,
  invited_by_name text,
  invited_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, pr.id, pr.name, pr.color, inv.name, m.invited_at
  from public.project_members m
  join public.projects pr on pr.id = m.project_id
  left join public.profiles inv on inv.id = m.invited_by
  where m.status = 'pending'
    and lower(m.email::text) = (select lower(p.email::text) from public.profiles p where p.id = (select auth.uid()))
  order by m.invited_at desc;
$$;

-- ── Delete a column: move its tasks to the next column (or previous if last), then delete ──
create or replace function public.delete_category(p_category_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c        public.categories%rowtype;
  v_target uuid;
  v_max    double precision;
begin
  select * into c from public.categories where id = p_category_id;
  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  if auth.uid() is null or not private.is_project_admin(c.project_id) then
    raise exception 'Only project admins can delete categories' using errcode = '42501';
  end if;

  if c.key = 'done' then
    raise exception 'The Done category cannot be deleted' using errcode = 'P0001';
  end if;

  select x.id into v_target
  from public.categories x
  where x.project_id = c.project_id and x.id <> c.id
    and (x.position, x.created_at) > (c.position, c.created_at)
  order by x.position, x.created_at
  limit 1;

  if v_target is null then
    select x.id into v_target
    from public.categories x
    where x.project_id = c.project_id and x.id <> c.id
    order by x.position desc, x.created_at desc
    limit 1;
  end if;

  if v_target is null then
    raise exception 'A project needs at least one category' using errcode = 'P0001';
  end if;

  select coalesce(max(t.position), 0) into v_max from public.tasks t where t.category_id = v_target;

  update public.tasks t
  set category_id = v_target,
      position    = v_max + s.rn
  from (
    select id, row_number() over (order by position, created_at) as rn
    from public.tasks
    where category_id = c.id
  ) s
  where t.id = s.id;

  delete from public.categories where id = c.id;
  return v_target;
end;
$$;

-- ── Dashboard numbers for the signed-in user (active projects only) ──
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
    'preview',  (select count(*) from t where key = 'preview'),
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

-- ── Activity graph: tasks completed per day (assigned to the user), in the user's timezone ──
create or replace function public.activity_graph(p_user_id uuid, p_days int default 365)
returns table (day date, completed int)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_tz   text;
  v_show boolean;
begin
  if v_uid is null then return; end if;

  select p.timezone, p.show_activity into v_tz, v_show from public.profiles p where p.id = p_user_id;
  if not found then return; end if;

  if p_user_id <> v_uid and (not v_show or not private.shares_project(p_user_id)) then
    return;
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_tz) then
    v_tz := 'UTC';
  end if;

  return query
    select (t.completed_at at time zone v_tz)::date as day, count(*)::int as completed
    from public.task_assignees a
    join public.tasks t on t.id = a.task_id
    where a.user_id = p_user_id
      and t.completed_at is not null
      and t.completed_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 365), 1), 400))
    group by 1
    order by 1;
end;
$$;

-- ── Profile page (/profile and /u/[username]) with privacy toggles. null => 404 ──
create or replace function public.get_profile(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  p      public.profiles%rowtype;
  v_self boolean;
  v_tz   text;
begin
  if v_uid is null then return null; end if;

  select * into p from public.profiles where username = lower(btrim(p_username));
  if not found then return null; end if;

  v_self := p.id = v_uid;
  if not v_self and not private.shares_project(p.id) then
    return null;
  end if;

  v_tz := case when exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p.timezone)
               then p.timezone else 'UTC' end;

  return jsonb_build_object(
    'id', p.id,
    'is_self', v_self,
    'name', p.name,
    'username', p.username,
    'avatar_url', p.avatar_url,
    'avatar_bg', p.avatar_bg,
    'avatar_fg', p.avatar_fg,
    'headline', p.headline,
    'bio', p.bio,
    'location', p.location,
    'website', p.website,
    'privacy', case when v_self then jsonb_build_object(
      'show_stats', p.show_stats,
      'show_activity', p.show_activity,
      'show_pinned', p.show_pinned,
      'show_recent_tasks', p.show_recent_tasks
    ) end,
    'stats', case when v_self or p.show_stats then jsonb_build_object(
      'projects', (
        select count(*) from public.project_members m
        where m.user_id = p.id and m.status = 'active'
      ),
      'open_tasks', (
        select count(*)
        from public.task_assignees a
        join public.tasks t on t.id = a.task_id
        join public.categories c on c.id = t.category_id
        where a.user_id = p.id and c.key is distinct from 'done'
      ),
      'completed_this_year', (
        select count(*)
        from public.task_assignees a
        join public.tasks t on t.id = a.task_id
        where a.user_id = p.id
          and t.completed_at >= (date_trunc('year', now() at time zone v_tz) at time zone v_tz)
      )
    ) end,
    'pinned', case when v_self or p.show_pinned then coalesce((
      select jsonb_agg(
        case when x.can_open then jsonb_build_object(
          'project_id', x.id, 'name', x.name, 'color', x.color, 'description', x.description,
          'can_open', true, 'total', x.total, 'done', x.done
        ) else jsonb_build_object(
          'name', x.name, 'color', x.color, 'can_open', false
        ) end
        order by x.pinned_at
      )
      from (
        select pr.id, pr.name, pr.color, pr.description, pp.pinned_at,
               private.is_project_member(pr.id) as can_open,
               (select count(*) from public.tasks t where t.project_id = pr.id) as total,
               (select count(*) from public.tasks t
                  join public.categories c on c.id = t.category_id
                 where t.project_id = pr.id and c.key = 'done') as done
        from public.project_pins pp
        join public.projects pr on pr.id = pp.project_id
        where pp.user_id = p.id
      ) x
    ), '[]'::jsonb) end
  );
end;
$$;

-- ── privileges: callable only by signed-in users (service role keeps access) ──
revoke all on function
  public.invite_member(uuid, text, text[], text, timestamptz),
  public.accept_invite(text),
  public.accept_pending_invite(uuid),
  public.my_pending_invites(),
  public.delete_category(uuid),
  public.dashboard_stats(),
  public.activity_graph(uuid, int),
  public.get_profile(text)
from public, anon;

grant execute on function
  public.invite_member(uuid, text, text[], text, timestamptz),
  public.accept_invite(text),
  public.accept_pending_invite(uuid),
  public.my_pending_invites(),
  public.delete_category(uuid),
  public.dashboard_stats(),
  public.activity_graph(uuid, int),
  public.get_profile(text)
to authenticated, service_role;

revoke all on function private.activate_membership(uuid, uuid) from public, anon, authenticated;
