begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'bob@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

insert into public.tasks (id, project_id, category_id, title, created_by)
select '00000000-0000-4000-8000-0000000000d1', c.project_id, c.id, 'A task', '00000000-0000-4000-8000-0000000000a1'
from public.categories c
where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo';

-- tasks.position must stay finite and bounded
select throws_ok(
  $$update public.tasks set position = 'NaN' where id = '00000000-0000-4000-8000-0000000000d1'$$,
  '23514',
  null,
  'NaN is rejected as a task position'
);
select throws_ok(
  $$update public.tasks set position = 'Infinity' where id = '00000000-0000-4000-8000-0000000000d1'$$,
  '23514',
  null,
  'Infinity is rejected as a task position'
);

-- avatar colours must be hex
select throws_ok(
  $$update public.profiles set avatar_bg = 'red; background:url(x)' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '23514',
  null,
  'a non-hex avatar colour is rejected'
);

-- a pending invite (no user yet) grants nothing to the invited person
insert into public.project_members (project_id, email, status)
values ('00000000-0000-4000-8000-0000000000c1', 'bob@example.com', 'pending');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.tasks), 0, 'a pending invitee sees no tasks');

-- housekeeping and agent functions are service-role only
select throws_ok(
  $$select public.cleanup_agent_data()$$,
  '42501',
  null,
  'authenticated cannot run cleanup_agent_data'
);
select throws_ok(
  $$select public.get_agent_bot_token('00000000-0000-4000-8000-0000000000e1')$$,
  '42501',
  null,
  'authenticated cannot read a bot token'
);

select * from finish();
rollback;
