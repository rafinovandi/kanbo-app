-- 022: the name an MCP client announces in its initialize handshake (for example "claude-code").
-- The MCP endpoint is stateless, so the name is kept on the link and shown as "Created by" on the tasks it creates.

alter table public.agent_links
  add column client_name text check (char_length(client_name) <= 64);
