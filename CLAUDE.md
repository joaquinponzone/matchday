# Matchday ⚽️

Multi-user Chelsea FC & Argentina national team match notification system, with a FIFA World Cup 2026 module (standings, prode, leaderboard).

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
- Tailwind CSS 4 + shadcn/ui (radix-ui style)
- Turso (SQLite) + Drizzle ORM
- Vercel (hosting + cron jobs)
- Telegram Bot API (messaging)
- Resend (email notifications)
- iron-session (auth/session management)
- bcryptjs (password hashing)
- zod (validation)
- date-fns (date utilities)
- Bun (runtime + package manager)

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes
│   │   ├── page.tsx        # Dashboard (upcoming matches)
│   │   ├── settings/       # User notification settings
│   │   ├── admin/          # Admin-only pages (users, prode config)
│   │   └── world-cup/      # FIFA WC 2026 module
│   │       ├── page.tsx    # Group standings + schedule tabs
│   │       └── prode/      # Predictions + leaderboard
│   ├── login/              # Auth pages (login, register, forgot/reset password)
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   └── api/
│       ├── cron/           # Cron jobs (sync-matches, daily, send-notifications)
│       ├── notifications/  # In-app notification endpoints
│       ├── settings/       # Settings API
│       ├── teams/          # Team search
│       ├── payments/prode/ # Talo Pay integration (WC prode prize pool)
│       └── webhooks/talo/  # Talo payment webhook handler
├── components/             # Shared UI components (nav, footer, etc.)
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities + API clients
│   ├── dal.ts              # Data Access Layer (session-aware helpers)
│   ├── session.ts          # iron-session config
│   ├── notifications.ts    # Notification dispatch orchestration
│   ├── email.ts            # Resend email client
│   ├── telegram.ts         # Telegram Bot API client
│   ├── football-data.ts    # Football-Data.org API client
│   ├── fifa.ts             # FIFA WC 2026 data helpers
│   ├── validations.ts      # Zod schemas
│   └── utils.ts            # cn(), formatMatchDate, formatTimeLeft, etc.
└── server/
    └── db/                 # Drizzle schema, client, queries, seed, migrations
```

## DB Schema (key tables)

- `users` — multi-user auth (email, passwordHash, role, status)
- `settings` — per-user notification preferences (linked to users)
- `matches` — synced match data (teamKey, opponent, competition, scores)
- `notifications` — sent notification log (idempotency via unique key)
- `followed_teams` — per-user team subscriptions
- `teams` — team reference data (crest, tla, etc.)
- `prode_predictions` — WC 2026 match score predictions per user
- `prode_entries` — prize pool entries (pending/paid/refunded via Talo Pay)
- `prode_config` — global prize pool config (entry fee, distribution %, registration state)

## Conventions

- Server Components by default. Only use `"use client"` when needed (interactivity, hooks, browser APIs).
- Database files in `src/server/db/` (not `src/lib/db/`).
- DB access via helpers in `src/server/db/queries.ts` — no raw Drizzle in routes or components.
- Auth via `src/lib/dal.ts` — use `getUser()` / `verifySession()` in server components and actions.
- Env var fallback pattern for DB: `TURSO_DATABASE_URL || DATABASE_URL`.
- Path alias: `@/*` maps to `src/*`.
- Code style: double quotes, no semicolons, 2-space indent, 80 char width (see .prettierrc).
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes.
- Cron endpoints at `src/app/api/cron/` — protected by `CRON_SECRET` header.
- Notification idempotency via unique `{match_id}_{channel}_{timing}` key in DB.
- User roles: `admin` | `user`. Admin pages under `(app)/admin/`.
- User status: `pending` | `active` | `inactive`. Require `active` for most actions.

## Specs

- `specs/IDEA.md` — Original vision
- `specs/SPECS.md` — Full technical specification (data model, APIs, cron logic, UI pages)
- `specs/FIFA-WORLD-CUP/IDEA.md` — WC 2026 module features
- `specs/FIFA-WORLD-CUP/prode/SPECS.md` — Prode feature spec
- `specs/FIFA-WORLD-CUP/memberships/SPECS.md` — Prize pool / Talo Pay integration spec
