begin;
select plan(5);

-- Alice owns the project, Bob is an active member, Carol is a stranger.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'bob@example.com'),
  ('00000000-0000-4000-8000-0000000000e3', 'carol@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

insert into public.project_members (project_id, user_id, email, status, accepted_at)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b2', 'bob@example.com', 'active', now());

insert into public.tasks (id, project_id, category_id, title, created_by)
select v.id, c.project_id, c.id, v.title, v.created_by
from public.categories c
cross join (values
  ('00000000-0000-4000-8000-0000000000d1'::uuid, 'Alice task', '00000000-0000-4000-8000-0000000000a1'::uuid),
  ('00000000-0000-4000-8000-0000000000d2'::uuid, 'Bob task', '00000000-0000-4000-8000-0000000000b2'::uuid),
  ('00000000-0000-4000-8000-0000000000d3'::uuid, 'Bob second task', '00000000-0000-4000-8000-0000000000b2'::uuid)
) as v(id, title, created_by)
where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo';

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e3","role":"authenticated"}', true);
delete from public.tasks where id = '00000000-0000-4000-8000-0000000000d2';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is(
  (select count(*)::int from public.tasks where id = '00000000-0000-4000-8000-0000000000d2'),
  1,
  'a non-member cannot delete a task'
);

delete from public.tasks where id = '00000000-0000-4000-8000-0000000000d1';
select is(
  (select count(*)::int from public.tasks where id = '00000000-0000-4000-8000-0000000000d1'),
  1,
  'a member cannot delete a task someone else created'
);

delete from public.tasks where id = '00000000-0000-4000-8000-0000000000d2';
select is(
  (select count(*)::int from public.tasks where id = '00000000-0000-4000-8000-0000000000d2'),
  0,
  'a member can delete a task they created'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
delete from public.tasks where id = '00000000-0000-4000-8000-0000000000d3';
select is(
  (select count(*)::int from public.tasks where id = '00000000-0000-4000-8000-0000000000d3'),
  0,
  'an admin can delete a task a member created'
);

delete from public.tasks where id = '00000000-0000-4000-8000-0000000000d1';
select is(
  (select count(*)::int from public.tasks where id = '00000000-0000-4000-8000-0000000000d1'),
  0,
  'an admin can delete their own task'
);

select * from finish();
rollback;
