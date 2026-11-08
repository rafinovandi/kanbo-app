begin;
select plan(5);

insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

insert into public.tasks (id, project_id, category_id, title, created_by)
select '00000000-0000-4000-8000-0000000000d1', c.project_id, c.id, 'A task', '00000000-0000-4000-8000-0000000000a1'
from public.categories c
where c.project_id = '00000000-0000-4000-8000-0000000000c1' and c.key = 'todo';

insert into public.agent_bots (id, owner_id, name, bot_id, bot_username)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', 'Bot', '123456', 'kanbo_test_bot');

insert into public.agent_links (id, project_id, bot_id, chat_id, token_hash, linked_by)
values (
  '00000000-0000-4000-8000-0000000000f1',
  '00000000-0000-4000-8000-0000000000c1',
  '00000000-0000-4000-8000-0000000000e1',
  '-100123',
  'hash-for-test',
  '00000000-0000-4000-8000-0000000000a1'
);

insert into public.agent_requests (token_id, idempotency_key, payload_hash, response_status, created_at) values
  ('00000000-0000-4000-8000-0000000000f1', 'old', 'x', 201, now() - interval '2 days'),
  ('00000000-0000-4000-8000-0000000000f1', 'new', 'x', 201, now());

insert into public.agent_rate_limits (token_id, window_start, count) values
  ('00000000-0000-4000-8000-0000000000f1', now() - interval '3 hours', 5),
  ('00000000-0000-4000-8000-0000000000f1', now(), 1);

insert into public.agent_link_codes (code_hash, project_id, bot_id, created_by, expires_at) values
  ('expired-code', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', now() - interval '2 days'),
  ('live-code',    '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', now() + interval '5 minutes');

insert into public.notification_log (link_id, task_id, event, status, created_at) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000d1', 'task.created', 'sent', now() - interval '40 days'),
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000d1', 'task.completed', 'sent', now());

select public.cleanup_agent_data();

select results_eq(
  $$select idempotency_key from public.agent_requests$$,
  $$values ('new')$$,
  'idempotency keys older than 24 hours are removed'
);
select is((select count(*)::int from public.agent_rate_limits), 1, 'old rate limit windows are removed');
select results_eq(
  $$select code_hash from public.agent_link_codes$$,
  $$values ('live-code')$$,
  'link codes that expired more than a day ago are removed'
);
select is((select count(*)::int from public.notification_log), 1, 'notification logs older than 30 days are removed');
select is((select count(*)::int from public.agent_links), 1, 'the active chat link is untouched');

select * from finish();
rollback;
