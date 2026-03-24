# Matchday

Personal match notification system for Chelsea FC and Argentina. Get notified about upcoming matches via Telegram, email, and in-app notifications.

## Features

- **Dashboard** — Next match countdown hero card + upcoming matches
- **Notifications** — Automated alerts via Telegram, email, and in-app
- **Flexible timing** — Configure day-before and match-day notification hours
- **Multi-team** — Follow Chelsea FC and Argentina national team
- **Notification history** — Filter by channel/status, mark as read
- **Settings** — Timezone, notification channels, timing preferences with auto-save

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Turso (SQLite) + Drizzle ORM
- **Hosting**: Vercel (with cron jobs)
- **Email**: Resend
- **Messaging**: Telegram Bot API
- **Auth**: iron-session (password-based, single-user)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Turso](https://turso.tech/) database
- API keys for: [football-data.org](https://www.football-data.org/), [Resend](https://resend.com/), [Telegram Bot](https://core.telegram.org/bots#botfather)

### Environment Variables

Create a `.env.local` file:

```env
FOOTBALL_DATA_API_KEY=   # football-data.org API key
TURSO_DATABASE_URL=      # Turso database URL
TURSO_AUTH_TOKEN=        # Turso auth token
TELEGRAM_BOT_TOKEN=      # Telegram Bot API token
RESEND_API_KEY=          # Resend API key
RESEND_FROM_DOMAIN=      # Domain for sending emails
CRON_SECRET=             # Secret for Vercel cron auth
SESSION_SECRET=          # iron-session encryption secret
LOGIN_PASSWORD=          # Password for login
```

### Setup

```bash
bun install              # Install dependencies
bun run db:push          # Push schema to Turso
bun run db:seed          # Seed default settings row
bun run dev              # Start dev server (Turbopack)
```

## Scripts

```bash
bun run dev              # Start dev server
bun run build            # Production build
bun run lint             # ESLint
bun run format           # Prettier
bun run typecheck        # TypeScript check
bun run db:generate      # Generate Drizzle migrations
bun run db:push          # Push schema to Turso
bun run db:seed          # Seed default settings
bun run db:studio        # Drizzle Studio
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── login/            # Password-based login
│   ├── (app)/            # Auth-protected route group
│   │   ├── page.tsx      # Dashboard
│   │   ├── notifications/
│   │   ├── settings/
│   │   └── upcoming-matches/
│   └── api/
│       ├── cron/         # Cron endpoints (daily sync + notify)
│       ├── notifications/
│       └── settings/
├── components/           # React components (ui/ for shadcn)
├── hooks/                # Custom React hooks
├── lib/                  # API clients + utilities
└── server/
    └── db/               # Drizzle schema, client, queries, migrations
```

## Cron Jobs

A daily cron job runs at 12:00 UTC (`/api/cron/daily`) that:

1. Syncs upcoming fixtures from football-data.org for all enabled teams
2. Dispatches notifications based on user timezone and configured hours
3. Uses idempotency keys to prevent duplicate notifications

## License

Private project.
