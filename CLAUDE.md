# Matchday

Personal Chelsea FC match notification system. Single-user, no auth.

## Commands

```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # ESLint
bun run format       # Prettier
bun run typecheck    # TypeScript check
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to Turso
bun run db:seed      # Seed default settings row
bun run db:studio    # Drizzle Studio
```

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (radix-maia style)
- Turso (SQLite) + Drizzle ORM
- Vercel (hosting + cron jobs)
- Resend (email), Telegram Bot API (messaging)
- Bun (runtime + package manager)

## Project Structure

```
src/
├── app/              # Next.js App Router pages + API routes
├── components/       # React components (ui/ for shadcn)
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities + API clients
└── server/
    └── db/           # Drizzle schema, client, queries, seed, migrations
```

## Conventions

- Server Components by default. Only use `"use client"` when needed (interactivity, hooks, browser APIs).
- Database files in `src/server/db/` (not `src/lib/db/`). Pattern from starter-2025.
- Env var fallback pattern for DB: `TURSO_DATABASE_URL || DATABASE_URL`.
- Path alias: `@/*` maps to `src/*`.
- Code style: double quotes, no semicolons, 2-space indent, 80 char width (see .prettierrc).
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes.
- Cron endpoints at `src/app/api/cron/` — protected by `CRON_SECRET` header.
- Notification idempotency via unique `{match_id}_{channel}_{timing}` key in DB.

## Specs

- `specs/IDEA.md` — Original vision
- `specs/SPECS.md` — Full technical specification (data model, APIs, cron logic, UI pages)
