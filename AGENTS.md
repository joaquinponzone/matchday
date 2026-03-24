# Agents Guide

## Key Files

- `specs/SPECS.md` — Full spec: data model, API integrations, cron jobs, UI pages
- `src/server/db/schema.ts` — Drizzle schema (settings, matches, notifications)
- `src/server/db/queries.ts` — All reusable DB query helpers
- `src/lib/notifications.ts` — Notification dispatch orchestration
- `src/lib/utils.ts` — Shared utilities (cn, formatTimeLeft, formatMatchDate, etc.)

## Patterns to Follow

- **DB access**: Always use query helpers from `src/server/db/queries.ts`. Do not write raw Drizzle queries in routes or components.
- **API clients**: Each external service has its own module in `src/lib/` (api-football.ts, telegram.ts, resend.ts). Keep them thin — just the HTTP call and error handling.
- **Cron endpoints**: GET handlers at `src/app/api/cron/`. Always validate `CRON_SECRET` from the Authorization header before processing.
- **Idempotency**: Notifications use a unique key (`{match_id}_{channel}_{timing}`). Check before sending. Let the DB constraint catch duplicates.
- **Timezones**: All dates stored as UTC in DB. Convert to user timezone (from settings) only at display time or when checking cron hours.
- **Components**: Use shadcn/ui from `@/components/ui/`. Custom components go in `@/components/`. Prefer Server Components; add `"use client"` only for interactivity.
- **shadcn CLI**: `bunx shadcn@latest add <component>` to install new components.

## Environment

- Runtime: `bun` (used as execution environment, not just package manager)
- Dev server: `bun run dev` (Turbopack)
- Type check: `bun run typecheck`
- DB migrations: `bun run db:generate && bun run db:push`
- Run scripts directly: `bun src/server/db/seed.ts`
