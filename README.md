# Kanbo

Kanban task manager for small teams: projects with members, roles and admins, a board per project, task assignees, and a personal profile with an activity graph.

> Status: **in development**. Sign in, projects and members, boards, tasks, profiles, and the agent integration (Telegram and MCP) are built. Request Access on the 403 page and email invites are not.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, `src/` directory) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Radix, `nova` style) themed with the Kanbo design tokens
- [Supabase](https://supabase.com): Postgres, Auth (Google OAuth), Realtime, Storage, RLS
- [iconsax-react](https://github.com/rendinjast/iconsax-react) (Linear) for icons, [Motion](https://motion.dev) for animation

## Getting started

```bash
npm install
cp env.example .env.local   # then fill in the values
npm run dev                 # http://localhost:3000
```

### Environment variables

See [`env.example`](./env.example). Minimum to run locally:

| Key | Where to find it |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys (`sb_secret_…`, server only) |

Invites and the agent integration also need these (both are in `env.example`):

| Key | Purpose |
|---|---|
| `TOKEN_HASH_PEPPER` | Secret used to hash invite tokens, agent chat tokens and link codes. Generate with `openssl rand -hex 32`. Use a different value per environment; changing it invalidates existing tokens. |
| `AGENT_ENABLED` | Set to `true` to turn on the agent endpoints (`/api/agent/v1` and `/api/agent/mcp`). Anything else makes them answer 404. |

Invite links are copied from the app and shared by hand; no email service is required.
Google OAuth credentials live in Supabase → Authentication → Providers → Google, not in `.env`.

## Agent integration

An AI agent can add and update tasks of a project through a Telegram chat, or directly from Claude Code and other MCP clients. Kanbo never needs an LLM key; the model runs on the agent's side.

- Setup for the Telegram skill and the **Claude Code / MCP** steps (get a token, `claude mcp add`, the four tools): [`integrations/README.md`](./integrations/README.md).
- Needs `AGENT_ENABLED=true` and `TOKEN_HASH_PEPPER` (see above).

## Project structure

```
src/
  app/            routes: (auth)/login, (dashboard)/…, auth/callback, invite/[token], api/agent (REST + MCP)
  actions/        shared server actions
  components/
    ui/           shadcn components (themed)
    common/       shared app components
  lib/            utils, supabase clients
  configs/ constants/ hooks/ providers/ stores/ validations/
  types/          database.types.ts (generated) + per-feature types
supabase/
  migrations/     SQL migrations (schema, triggers, RLS, RPC, realtime, storage)
  tests/          pgTAP tests
```

## Database

Migrations in `supabase/migrations/` (001 to 023) are applied in order to each Supabase project; a new project also needs one row in `private.app_config` (`supabase_host`, your project's host) or avatar uploads are rejected. After a schema change, regenerate the types:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
```

Never edit `src/types/database.types.ts` by hand.

## Deploy

1. Create a Supabase project and apply every file in `supabase/migrations/` in order (SQL editor or `npx supabase db push`). Add the `private.app_config` row described under [Database](#database).
2. In Supabase → Authentication → Providers → Google, add your Google OAuth client ID and secret. Add `https://<your-domain>/auth/callback` to the Google redirect URIs and to Supabase → Authentication → URL Configuration.
3. Import the repo into [Vercel](https://vercel.com) and set the environment variables from [`env.example`](./env.example). Set `NEXT_PUBLIC_APP_URL` to your production URL and generate a fresh `TOKEN_HASH_PEPPER` for production.
4. Deploy. Use a separate Supabase project for production; do not reuse your development keys.

To report a security issue, see [`SECURITY.md`](./SECURITY.md).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
