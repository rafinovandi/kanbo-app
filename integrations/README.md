# Kanbo agent integration

Lets an AI agent (OpenClaw, Hermes, Claude Code, or any agent that can run a script) add and update Kanbo tasks from a Telegram chat. The model runs on the agent's side; Kanbo never needs an LLM key.

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

1. Copy the folder `integrations/skill/kanbo/` into the agent's skills folder.
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

Raw REST works too: `POST /api/agent/v1/link`, `GET /context`, `GET|POST /tasks`, `PATCH /tasks/:id`, `DELETE /link` with `Authorization: Bearer kbo_…`. Saving requires an `Idempotency-Key` header; add `"dryRun": true` to preview. Limit: 60 requests per minute per chat.

## Privacy

Photos and text sent to the bot are processed by the LLM on the agent's side, not by Kanbo. Kanbo only receives the resulting task text. A chat can be disconnected at any time from Connect Chat (Revoke).
