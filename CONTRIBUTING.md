# Contributing to Kanbo

Thanks for taking the time to help. This page explains how to set the project up, what a good change looks like, and how it gets reviewed.

By taking part you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). To report a security problem, do not open an issue: follow [SECURITY.md](./SECURITY.md).

## Set up

1. Fork the repository and clone your fork.
2. Follow **Getting started** in the [README](./README.md): `npm install`, copy `env.example` to `.env.local`, fill in the values.
3. Use your own Supabase project for development and apply every file in `supabase/migrations/`, in order. Never point a development copy at a database that holds real data.
4. `npm run dev` starts the app at http://localhost:3000.

## Before you open a pull request

Run these and make sure they pass (CI runs the same):

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

For a UI change, try it in the browser in both light and dark mode, and attach a screenshot to the pull request.

## How to make a change

- Open an issue first for anything bigger than a small fix, so the direction can be agreed before you spend time on it.
- Branch from `main` with a short name (`fix/board-drag-flicker`, `feat/landing-page`) and keep each pull request about one thing.
- Write commit messages in the style of the history: `type(scope): short summary`, for example `fix(tasks): clamp out-of-range task positions`.
- Explain the _why_ in the pull request description, not only the _what_.

## Code conventions

- **Reuse before you write.** Look in `src/components/ui`, `src/components/common`, `src/lib`, `src/hooks` and `src/constants` first. Extend an existing component with a prop instead of copying it.
- **Use the shadcn components** already in `src/components/ui`. Do not restyle them for one screen, and ask in the issue before adding a new one.
- **Colors come from tokens.** No hex values in components. Use the semantic tokens (`bg-background`, `text-muted-foreground`, ...) and the `kb-*` palette defined in `src/app/globals.css`. If a color is missing, add a token there.
- **Structure.** `page.tsx` stays thin and renders a component from the route's `_components/` folder; shared pieces live in `src/components/common`. Server actions sit in `actions.ts` next to the route (or `src/actions/` when shared), with validation in `src/validations/`.
- **Next.js 16 with Cache Components.** Code that reads the session or cookies must sit inside `<Suspense>`. Read the guide for the API you use in `node_modules/next/dist/docs/` before writing code, because this version differs from older ones.
- **Types.** `src/types/database.types.ts` is generated; never edit it by hand. Derive feature types from it.
- **UI text is English**, with Title Case on buttons and dialog titles.
- **Accessibility.** Real `<button>` and `<a>` elements, `aria-label` on icon-only buttons, and motion that respects `prefers-reduced-motion`.
- **Comments.** Keep them few: explain the reason behind a decision, not what the next line does.
- **No new dependencies without asking.** Prefer what is already installed.

## Database changes

- Add a new file to `supabase/migrations/` (`supabase migration new <name>`); never edit a migration that is already in the history.
- Every table needs Row Level Security with policies. Add or update the pgTAP tests in `supabase/tests/`.
- Regenerate the types afterwards (see **Database** in the README).

## Reviews

A maintainer will review your pull request when they can. Small, focused pull requests are reviewed faster. You may be asked for changes; that is a normal part of the process, not a rejection.
