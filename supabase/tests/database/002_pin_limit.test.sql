begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'bob@example.com');

insert into public.projects (id, owner_id, name) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'One'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a1', 'Two'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000a1', 'Three'),
  ('00000000-0000-4000-8000-0000000000c4', '00000000-0000-4000-8000-0000000000a1', 'Four');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.project_pins (project_id) values
      ('00000000-0000-4000-8000-0000000000c1'),
      ('00000000-0000-4000-8000-0000000000c2'),
      ('00000000-0000-4000-8000-0000000000c3')$$,
  'a user can pin 3 projects'
);

select throws_ok(
  $$insert into public.project_pins (project_id) values ('00000000-0000-4000-8000-0000000000c4')$$,
  'P0001',
  'You can pin up to 3 projects',
  'the 4th pin is rejected'
);

select is((select count(*)::int from public.project_pins), 3, 'only 3 pins were saved');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.project_pins (project_id) values ('00000000-0000-4000-8000-0000000000c1')$$,
  'P0001',
  'You can only pin projects you are an active member of',
  'a non-member cannot pin a project'
);

select is((select count(*)::int from public.project_pins), 0, 'a user never sees the pins of someone else');

select * from finish();
rollback;
