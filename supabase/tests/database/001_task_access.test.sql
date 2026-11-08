begin;
select plan(5);

-- Alice owns the project, Bob is a stranger, then becomes an active member.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'bob@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

insert into public.tasks (id, project_id, category_id, title, created_by)
select '00000000-0000-4000-8000-0000000000d1', c.project_id, c.id, 'Secret task', '00000000-0000-4000-8000-0000000000a1'
from public.categories c
where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo';

select is(
  (select count(*)::int from public.categories where project_id = '00000000-0000-4000-8000-0000000000c1'),
  4,
  'a new project gets its four default columns'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.tasks), 1, 'the owner sees the task');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.tasks), 0, 'a non-member sees no tasks');
select is((select count(*)::int from public.categories), 0, 'a non-member sees no columns');

reset role;
insert into public.project_members (project_id, user_id, email, status, accepted_at)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b2', 'bob@example.com', 'active', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.tasks), 1, 'an active member sees the task');

select * from finish();
rollback;
