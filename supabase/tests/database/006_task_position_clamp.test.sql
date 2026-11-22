begin;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.tasks (project_id, category_id, title, position)
    select c.project_id, c.id, 'At the limit', 1e15
    from public.categories c
    where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo'$$,
  'a member can write a position at the limit'
);

select lives_ok(
  $$insert into public.tasks (project_id, category_id, title, position)
    select c.project_id, c.id, 'After the limit', 1e15 + 1
    from public.categories c
    where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo'$$,
  'a position above the limit is accepted'
);

select is(
  (select position from public.tasks where title = 'After the limit'),
  1e15::float8,
  'a position above the limit is clamped to the limit'
);

update public.tasks set position = 'NaN'::float8 where title = 'At the limit';
select is(
  (select position from public.tasks where title = 'At the limit'),
  1e15::float8,
  'NaN is clamped to the upper limit'
);

update public.tasks set position = 'Infinity'::float8 where title = 'At the limit';
select is(
  (select position from public.tasks where title = 'At the limit'),
  1e15::float8,
  'Infinity is clamped to the upper limit'
);

update public.tasks set position = '-Infinity'::float8 where title = 'At the limit';
select is(
  (select position from public.tasks where title = 'At the limit'),
  -1e15::float8,
  '-Infinity is clamped to the lower limit'
);

update public.tasks set position = 5 where title = 'At the limit';
select is(
  (select position from public.tasks where title = 'At the limit'),
  5::float8,
  'a normal position is left untouched'
);

select * from finish();
rollback;
