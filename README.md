# Kanbo

Kanban task manager for small teams: projects with members, roles and admins, a board per project, task assignees, and a personal profile with an activity graph.

> Status: **starter**. Project structure, UI theme and database schema are in place; app features are not built yet.

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

Invites also need `TOKEN_HASH_PEPPER` (`openssl rand -hex 32`). Invite links are copied from the app and shared by hand; no email service is required.
Google OAuth credentials live in Supabase → Authentication → Providers → Google, not in `.env`.

## Project structure

```
src/
  app/            routes: (auth)/login, (dashboard)/…, auth/callback, invite/[token]
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

Migrations in `supabase/migrations/` are already applied to the dev project. After a schema change, regenerate the types:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
```

Never edit `src/types/database.types.ts` by hand.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
