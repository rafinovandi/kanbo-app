begin;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'bob@example.com', '{}', repeat('a', 40), null)$$,
  'an admin can invite a new email'
);

select throws_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'bob@example.com', '{}', repeat('b', 40), null)$$,
  'P0001',
  'This person was invited less than an hour ago. Try again later.',
  'the same pending email cannot be invited again within an hour'
);

reset role;
update public.project_members set invited_at = now() - interval '2 hours' where lower(email::text) = 'bob@example.com';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'bob@example.com', '{}', repeat('c', 40), null)$$,
  'the same pending email can be invited again after the cooldown'
);

select lives_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'person' || i || '@example.com', '{}', md5(i::text) || md5(i::text), null)
    from generate_series(1, 19) i$$,
  'the user can reach 20 new emails in a day'
);

select throws_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'one-too-many@example.com', '{}', repeat('d', 40), null)$$,
  'P0001',
  'You can invite up to 20 new people per day. Try again tomorrow.',
  'the 21st new email in a day is rejected'
);

select is(
  (select count(*)::int from public.project_members where lower(email::text) = 'one-too-many@example.com'),
  0,
  'the rejected email was not added'
);

reset role;
delete from public.project_members where lower(email::text) like 'person%@example.com';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select throws_ok(
  $$select public.invite_member('00000000-0000-4000-8000-0000000000c1', 'after-delete@example.com', '{}', repeat('e', 40), null)$$,
  'P0001',
  'You can invite up to 20 new people per day. Try again tomorrow.',
  'removing pending members does not give the daily quota back'
);

select * from finish();
rollback;
