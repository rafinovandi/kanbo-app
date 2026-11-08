begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'alice@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'bob@example.com');

insert into public.projects (id, owner_id, name)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Alice project');

-- Bob is a second admin (not the owner)
insert into public.project_members (project_id, user_id, email, status, is_admin, accepted_at)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b2', 'bob@example.com', 'active', true, now());

-- an MCP link needs no bot
select lives_ok(
  $$insert into public.agent_links (id, project_id, kind, chat_id, token_hash, linked_by)
    values ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', 'mcp', 'mcp-test-1', 'hash-mcp-1', '00000000-0000-4000-8000-0000000000b2')$$,
  'an MCP link can be created without a bot'
);

-- a Telegram chat link still needs a bot
select throws_ok(
  $$insert into public.agent_links (project_id, kind, chat_id, token_hash, linked_by)
    values ('00000000-0000-4000-8000-0000000000c1', 'chat', '-100555', 'hash-chat-1', '00000000-0000-4000-8000-0000000000b2')$$,
  '23514',
  null,
  'a chat link without a bot is rejected'
);

-- unknown kinds are rejected
select throws_ok(
  $$insert into public.agent_link_codes (code_hash, project_id, kind, created_by)
    values ('code-x', '00000000-0000-4000-8000-0000000000c1', 'smtp', '00000000-0000-4000-8000-0000000000b2')$$,
  '23514',
  null,
  'an unknown link kind is rejected'
);

-- an MCP link code needs no bot either
select lives_ok(
  $$insert into public.agent_link_codes (code_hash, project_id, kind, created_by)
    values ('code-mcp', '00000000-0000-4000-8000-0000000000c1', 'mcp', '00000000-0000-4000-8000-0000000000b2')$$,
  'an MCP link code can be created without a bot'
);

-- removing the admin who linked it revokes the MCP link
delete from public.project_members
where project_id = '00000000-0000-4000-8000-0000000000c1' and user_id = '00000000-0000-4000-8000-0000000000b2';

select isnt(
  (select revoked_at from public.agent_links where id = '00000000-0000-4000-8000-0000000000f1'),
  null,
  'removing the linking admin revokes their MCP link'
);

select * from finish();
rollback;
