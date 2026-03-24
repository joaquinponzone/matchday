# Matchday - Specifications

## 1. Overview

Personal notification system for Chelsea FC matches. Syncs fixtures from football-data.org, stores them in Turso (SQLite), and dispatches notifications via Telegram, email, and in-app.

Single-user system — no authentication required.

### Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Turso (SQLite) + Drizzle ORM
- **Hosting**: Vercel
- **Cron**: Vercel Cron Jobs
- **Email**: Resend
- **Messaging**: Telegram Bot API

---

## 2. Features

### MVP (Phase 1)

- [ ] Sync Chelsea FC fixtures from football-data.org
- [ ] Dashboard showing next 5 matches
- [ ] Settings page (email, Telegram chat ID, timezone, notification preferences)
- [ ] Cron-based notification dispatch (day before + morning of match)
- [ ] In-app notification history

### Phase 2

- [ ] Show match results (scores) after games finish
- [ ] Notifications for postponed/rescheduled matches
- [ ] "Send test notification" button in settings

### Phase 3

- [ ] WhatsApp/SMS via Twilio
- [ ] Push notifications
- [ ] Multi-team support

---

## 3. Data Model

### `settings` (single row)

| Column                    | Type    | Description                              |
| ------------------------- | ------- | ---------------------------------------- |
| `id`                      | integer | Primary key (always 1)                   |
| `email`                   | text    | Email address for notifications          |
| `telegram_chat_id`        | text    | Telegram chat ID                         |
| `timezone`                | text    | User timezone (e.g. `America/Argentina/Buenos_Aires`) |
| `email_enabled`           | integer | Toggle email channel (0/1)               |
| `telegram_enabled`        | integer | Toggle Telegram channel (0/1)            |
| `in_app_enabled`          | integer | Toggle in-app notifications (0/1)        |
| `notify_day_before`       | integer | Toggle day-before notification (0/1)     |
| `notify_match_day`        | integer | Toggle match-day notification (0/1)      |
| `day_before_hour`         | integer | Hour to send day-before notification (0-23, in user timezone) |
| `match_day_hour`          | integer | Hour to send match-day notification (0-23, in user timezone) |
| `created_at`              | text    | ISO 8601 timestamp                       |
| `updated_at`              | text    | ISO 8601 timestamp                       |

### `matches`

| Column              | Type    | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| `id`                | integer | Primary key                              |
| `api_football_id`   | integer | Unique fixture ID from football-data.org |
| `opponent`          | text    | Opponent team name                       |
| `opponent_logo`     | text    | Opponent team logo URL                   |
| `competition`       | text    | Competition name (e.g. Premier League)   |
| `competition_logo`  | text    | Competition logo URL                     |
| `match_date`        | text    | Match date/time in UTC (ISO 8601)        |
| `venue`             | text    | Stadium name                             |
| `is_home`           | integer | Whether Chelsea is home team (0/1)       |
| `status`            | text    | Match status (`scheduled`, `live`, `finished`, `postponed`) |
| `chelsea_score`     | integer | Chelsea goals (nullable)                 |
| `opponent_score`    | integer | Opponent goals (nullable)                |
| `created_at`        | text    | ISO 8601 timestamp                       |
| `updated_at`        | text    | ISO 8601 timestamp                       |

### `notifications`

| Column            | Type    | Description                              |
| ----------------- | ------- | ---------------------------------------- |
| `id`              | integer | Primary key                              |
| `match_id`        | integer | FK to `matches.id`                       |
| `channel`         | text    | `email`, `telegram`, or `in_app`         |
| `timing`          | text    | `day_before` or `match_day`              |
| `idempotency_key` | text    | Unique: `{match_id}_{channel}_{timing}`  |
| `status`          | text    | `sent`, `failed`, `read`                 |
| `title`           | text    | Notification title                       |
| `body`            | text    | Notification body content                |
| `error`           | text    | Error message if failed (nullable)       |
| `sent_at`         | text    | ISO 8601 timestamp                       |
| `read_at`         | text    | ISO 8601 timestamp (nullable)            |
| `created_at`      | text    | ISO 8601 timestamp                       |

**Idempotency**: The `idempotency_key` (`{match_id}_{channel}_{timing}`) has a unique constraint. This prevents duplicate notifications — if a cron job runs twice, the second insert is a no-op.

---

## 4. API Integrations

### football-data.org v4

- **Endpoint**: `GET https://api.football-data.org/v4/teams/61/matches?status=SCHEDULED&limit=15`
- **Team ID**: 61 (Chelsea FC)
- **Headers**: `X-Auth-Token: {FOOTBALL_DATA_API_KEY}`
- **Usage**: Sync upcoming fixtures. Upsert matches by `api_football_id`.
- **Docs**: https://www.football-data.org/documentation/quickstart

### Telegram Bot API

- **Endpoint**: `POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage`
- **Body**: `{ chat_id, text, parse_mode: "HTML" }`
- **Setup**: User creates a bot via @BotFather, starts a conversation, and provides the chat ID in settings.

### Resend

- **Endpoint**: `POST https://api.resend.com/emails`
- **Headers**: `Authorization: Bearer {RESEND_API_KEY}`
- **Body**: `{ from: "Matchday <notifications@{RESEND_FROM_DOMAIN}>", to: [email], subject, html }`
- **Docs**: https://resend.com/docs/api-reference/emails/send-email

---

## 5. Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-matches",
      "schedule": "0 6,14,22 * * *"
    },
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

### `sync-matches` (3x/day at 06:00, 14:00, 22:00 UTC)

1. Fetch next 15 fixtures from football-data.org
2. Upsert into `matches` table by `api_football_id`
3. Update status/scores for existing matches

### `send-notifications` (every hour)

1. Read settings (timezone, enabled channels, configured hours)
2. Convert current UTC time to user's timezone
3. If current hour matches `day_before_hour`:
   - Find matches happening tomorrow (in user's timezone)
   - For each match + enabled channel, check `idempotency_key`
   - Send notification if not already sent
4. If current hour matches `match_day_hour`:
   - Find matches happening today (in user's timezone)
   - Same idempotency check and dispatch

Both endpoints are protected by `CRON_SECRET` header validation (Vercel sends this automatically).

---

## 6. Notification Content

### Template (basic)

**Subject/Title**: `Chelsea vs {opponent} — {competition}`

**Body**:
```
{competition_logo} {competition}
Chelsea {home_away_indicator} {opponent}
{match_date formatted to user timezone}
{venue}
```

The same content is adapted per channel:
- **Email**: HTML formatted with team logos
- **Telegram**: HTML parse mode with bold/italic
- **In-app**: Stored in `notifications` table, displayed in UI

---

## 7. UI Pages

### `/` — Dashboard

- **Hero card**: Next match with opponent logo, competition, date/time (in user timezone), venue, countdown
- **Upcoming list**: Next 4 matches after the hero match, compact cards
- **Empty state**: "No upcoming matches" message when off-season

### `/settings` — Preferences

- **Timezone**: Dropdown/searchable select
- **Email**: Input field + enable/disable toggle
- **Telegram**: Chat ID input + enable/disable toggle + link to setup instructions
- **In-app**: Enable/disable toggle
- **Timing**: Day-before toggle + hour select, match-day toggle + hour select
- **Test notification**: Button (Phase 2)
- Auto-saves on change (no submit button)

### `/notifications` — History

- **List**: All sent notifications, newest first
- **Filters**: By channel (`email`, `telegram`, `in_app`), by status (`sent`, `failed`, `read`)
- **Mark as read**: Click to mark in-app notifications as read
- **Badge**: Unread count in navigation

---

## 8. Environment Variables

| Variable             | Description                        |
| -------------------- | ---------------------------------- |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key       |
| `TURSO_DATABASE_URL` | Turso database URL                 |
| `TURSO_AUTH_TOKEN`   | Turso auth token                   |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token             |
| `RESEND_API_KEY`     | Resend API key                     |
| `RESEND_FROM_DOMAIN` | Domain for sending emails          |
| `CRON_SECRET`        | Secret for Vercel cron auth        |

---

## 9. File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Dashboard
│   ├── settings/
│   │   └── page.tsx                      # Settings form
│   ├── notifications/
│   │   └── page.tsx                      # Notification history
│   └── api/
│       ├── settings/
│       │   └── route.ts                  # GET/PUT settings
│       ├── notifications/
│       │   ├── route.ts                  # GET notifications
│       │   └── [id]/
│       │       └── route.ts              # PATCH mark as read
│       └── cron/
│           ├── sync-matches/
│           │   └── route.ts              # Sync fixtures cron
│           └── send-notifications/
│               └── route.ts              # Dispatch notifications cron
├── components/
│   ├── match-card.tsx                    # Match display card
│   ├── match-hero.tsx                    # Next match hero card
│   ├── notification-item.tsx             # Notification list item
│   ├── settings-form.tsx                 # Settings form component
│   └── nav.tsx                           # Navigation with unread badge
└── lib/
    ├── db/
    │   ├── index.ts                      # Drizzle client (Turso)
    │   ├── schema.ts                     # Drizzle schema definitions
    │   └── queries.ts                    # Query helpers
    ├── football-data.ts                  # football-data.org client
    ├── telegram.ts                       # Telegram Bot client
    ├── resend.ts                         # Resend email client
    ├── notifications.ts                  # Notification dispatch logic
    └── utils.ts                          # Date/timezone helpers
```

---

## 10. Implementation Sequence

1. **Database layer** — Drizzle schema + Turso connection + seed settings row
2. **API Football integration** — Client + sync cron endpoint
3. **Dashboard UI** — Hero card + upcoming matches list
4. **Settings page** — Form + API route
5. **Notification dispatch** — Telegram + email + in-app clients, cron endpoint
6. **Notification history UI** — List + filters + mark as read
7. **Deploy + verify** — Environment variables, cron jobs, end-to-end test
