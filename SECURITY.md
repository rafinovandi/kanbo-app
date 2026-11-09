# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report them privately through GitHub: open the **Security** tab of this repository and choose **Report a vulnerability**. Include the steps to reproduce, the affected area (web app, agent API, or MCP endpoint), and the impact you expect.

You can expect an initial response within a few days. Please give us reasonable time to fix the issue before disclosing it.

## Scope

- The Next.js app and its server actions
- The agent HTTP API and MCP endpoint (bearer-token authenticated)
- Supabase migrations, RLS policies, and RPC functions in `supabase/`

## Supported versions

Only the latest commit on `main` is supported.

## Operator notes

If you self-host Kanbo, keep `SUPABASE_SECRET_KEY` and `TOKEN_HASH_PEPPER` out of version control and rotate them if they are ever exposed.
