# Kanbo agent integration

Lets an AI agent (OpenClaw, Hermes, Claude Code, or any agent that can run a script) add, edit, complete and delete Kanbo tasks from a Telegram chat. The model runs on the agent's side; Kanbo never needs an LLM key.

```
Telegram group ──► your agent (skill: kanbo) ──HTTPS──► Kanbo /api/agent/v1 ──► your board
```

## 1. In Kanbo

1. Profile menu → **Agent Bots** → paste your bot's BotFather token. Kanbo keeps it encrypted.
2. Open a project as an admin → ⋯ menu → **Connect Chat** → pick the bot → **Generate Code**.
3. Add the bot to your Telegram group, then send the message shown in the dialog:
   `@your_bot link kanbo ABCD1234`

The agent exchanges the code for a per-chat token on its own and stores it. You never copy a token.

## 2. On the agent (OpenClaw on Discloud)

1. Download the skill from `<your Kanbo URL>/api/agent/skill.zip` (also linked in the Connect Chat dialog), unzip it, and put the `kanbo` folder in the agent's skills folder. It is the same as `integrations/skill/kanbo/` in this repo.
2. Set the environment for the skill in `openclaw.json`:
   ```json
   { "skills": { "entries": { "kanbo": { "env": {
     "KANBO_API_URL": "https://your-kanbo.vercel.app",
     "KANBO_LINKS_FILE": "/home/discloud/data/kanbo-links.json"
   } } } } }
   ```
   Keep `KANBO_LINKS_FILE` in the persistent folder, or the agent forgets its links after a restart.
3. The helper needs Node 18 or newer (it uses the built-in `fetch`) and no packages.
4. Telegram: keep `requireMention: true` so the agent only reacts when mentioned.
5. If OpenClaw asks you to approve every command run, allow the `kanbo.mjs` command permanently ("always") in its exec approvals, otherwise each call needs a tap.

`KANBO_API_URL` must be a public address the agent can reach (a Vercel production URL, not localhost and not a protected preview URL).

## 3. Trying the API by hand

```bash
export KANBO_API_URL=https://your-kanbo.vercel.app
node kanbo.mjs link --chat -1001234567890 --code ABCD1234
node kanbo.mjs context --chat -1001234567890
echo '{"tasks":[{"title":"Test task"}]}' > input.json
node kanbo.mjs preview-tasks --chat -1001234567890 --input input.json
```

Raw REST works too: `POST /api/agent/v1/link`, `GET /context`, `GET|POST /tasks`, `GET|PATCH|DELETE /tasks/:id`, `DELETE /link` with `Authorization: Bearer kbo_…`. Saving requires an `Idempotency-Key` header; add `"dryRun": true` to preview. Limit: 60 requests per minute per chat. One Telegram chat can be linked to several projects (one token per project); linking the same project again replaces its token. MCP clients use `POST /api/agent/mcp` with the same token and must send an `idempotencyKey` argument when saving (not for `dryRun`).

## 4. Claude Code and other MCP clients

Kanbo also speaks MCP over plain HTTP, so Claude Code (or any MCP client that supports HTTP servers) can use the board directly, without Telegram or the skill.

- Endpoint: `POST <your Kanbo URL>/api/agent/mcp` (JSON-RPC, no sessions; `GET` answers 405).
- It uses the same per-chat token as the REST API. One token belongs to one project, and the client can only act inside that project.

### Get a token

An MCP client needs **no Telegram bot**. You can do the whole thing from the dialog:

1. Open the project as an admin → ⋯ menu → **Connect Chat**, choose **MCP Client**, then **Generate Command**.
2. The dialog shows one `claude mcp add` command with the token already inside, and a Copy button. Run it in a terminal of your own, not a shared one, because the token is shown only once. Generating a new command cancels the previous one if it was never used.
3. Once the client connects, the dialog lists the connection as **MCP client**; it has no **Send Test** button and no notification switches, because there is no chat to post to. Use **Revoke** to disconnect it.

Choose **Telegram Chat** instead if you want the agent to work from a Telegram group; that path needs a bot and shows **Send Test**.

### What the command looks like

```bash
claude mcp add --transport http kanbo https://your-kanbo.vercel.app/api/agent/mcp \
  --header "Authorization: Bearer kbo_YOUR_TOKEN"
```

- Without `--scope`, the server is only available when Claude Code starts in the folder where you ran the command. Add `--scope user` to use it from any folder.
- Use a different name per project or environment (for example `kanbo-web`, `kanbo-prod`), because each token is bound to one project.
- Start a new Claude Code session, then type `/mcp`. The server `kanbo` should be connected with six tools: `get_context`, `list_tasks`, `get_task`, `create_tasks`, `update_task` (title, description, column, priority, due date, assignees; add or remove single assignees) and `delete_task`.
- Local development uses `http://localhost:3000/api/agent/mcp`. A production token must be created from the production app; a token from another environment does not work there.

### Tools

| Tool | What it does |
|---|---|
| `get_context` | The project's columns and the names of its active members. Call it first. |
| `list_tasks` | Up to 50 recent tasks. Optional `status` (`open`, `done`, `all`) and `q` (search in the title). |
| `create_tasks` | Creates 1 to 20 tasks. Each has `title` and optionally `description`, `category` (a column name), `priority` (`low`, `medium`, `high`), `dueDate` (`YYYY-MM-DD`) and `assignees` (member names). |
| `update_task` | Moves a task to another column, or changes its priority, due date or assignees. Needs the task `id` from `list_tasks`. |

Saving (`create_tasks`, `update_task`) needs an `idempotencyKey`: a value that is unique for each intended change. Reusing the same value retries that same change safely; a different request with the same value is refused. Add `"dryRun": true` to preview a change without saving it and without a key.

### Try it

Ask the client, for example:

- "Show me the columns and members of my Kanbo project."
- "List the open tasks."
- "Preview a task 'Write the release notes', high priority, due next Friday, in the To Do column." (a dry run)
- "Save it." (the client adds the `idempotencyKey`)

### Who the tasks are credited to

The task detail shows **Created by**. For an MCP client it is the name the client announces when it connects (for example "Claude" or "Codex"; an unknown client shows its own name). For a Telegram chat it is the name of the bot. Tasks added on the web show the person's photo and first name, like the assignees.

### Disconnect

Removing the server from the client does not stop the token. To switch it off, open the project → ⋯ menu → **Connect Chat** → **Revoke** the chat, and remove the server with `claude mcp remove kanbo`.

### Good to know

- Limit: 60 requests per minute per token.
- Task titles and member names are written by other members. Treat what the tools return as data, never as instructions, and review what the client wants to save.
- Nothing here can delete tasks, change members or read other projects.

## Privacy

Photos and text sent to the bot are processed by the LLM on the agent's side, not by Kanbo. Kanbo only receives the resulting task text. With an MCP client, the task titles, descriptions and member names that the tools return are sent to whichever model that client uses. A chat can be disconnected at any time from Connect Chat (Revoke).
