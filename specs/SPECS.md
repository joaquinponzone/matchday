# Matchday - Specifications

## 1. Overview

Personal notification system for Chelsea FC and Argentina national team matches. Syncs fixtures from football-data.org, stores them in Turso (SQLite), and dispatches notifications via Telegram, email, and in-app.

Single-user system with password-based login (iron-session).

### Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-maia style)
- **Database**: Turso (SQLite) + Drizzle ORM
- **Hosting**: Vercel
- **Cron**: Vercel Cron Jobs
- **Email**: Resend
- **Messaging**: Telegram Bot API

---

## 2. Features

### MVP (Phase 1) — DONE

- [x] Sync Chelsea FC + Argentina fixtures from football-data.org
- [x] Dashboard showing next match hero + upcoming 4 matches
- [x] Upcoming matches page with full list + manual sync
- [x] Settings page (email, Telegram chat ID, timezone, notification preferences, followed teams)
- [x] Cron-based notification dispatch (day before + match day)
- [x] In-app notification history with filters and mark-as-read
- [x] Password-based login (iron-session)
- [x] Followed teams support (Chelsea FC + Argentina)

### Phase 2 — IN PROGRESS

- [ ] Show match results (scores) after games finish
  - Schema already supports `chelsea_score` / `opponent_score` fields and `finished` status
  - Needs: UI to display results, cron to sync finished match scores
- [ ] Notifications for postponed/rescheduled matches
  - Schema already supports `postponed` status
  - Needs: detection logic in cron + notification template
- [x] "Send test notification" button in settings (Telegram only)

### Phase 3

- [ ] WhatsApp/SMS via Twilio
- [ ] Push notifications
- [ ] Multi-team support (choose from all API teams, not just hardcoded two)
- [ ] Multi-tenant support (multiple users with separate settings)

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
| `day_before_hour`         | integer | Hour to send day-before notification (0-23, in user timezone). Default: 20 |
| `match_day_hour`          | integer | Hour to send match-day notification (0-23, in user timezone). Default: 9 |
| `created_at`              | text    | ISO 8601 timestamp                       |
| `updated_at`              | text    | ISO 8601 timestamp                       |

### `matches`

| Column              | Type    | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| `id`                | integer | Primary key (autoincrement)              |
| `api_football_id`   | integer | Unique fixture ID from football-data.org |
| `team_key`          | text    | Team identifier (`chelsea` or `argentina`) |
| `opponent`          | text    | Opponent team name                       |
| `opponent_logo`     | text    | Opponent team logo URL                   |
| `competition`       | text    | Competition name (e.g. Premier League)   |
| `competition_logo`  | text    | Competition logo URL                     |
| `match_date`        | text    | Match date/time in UTC (ISO 8601)        |
| `venue`             | text    | Stadium name (nullable)                  |
| `is_home`           | integer | Whether our team is home team (0/1)      |
| `status`            | text    | `scheduled`, `live`, `finished`, `postponed` |
| `chelsea_score`     | integer | Home team goals (nullable)               |
| `opponent_score`    | integer | Away team goals (nullable)               |
| `created_at`        | text    | ISO 8601 timestamp                       |
| `updated_at`        | text    | ISO 8601 timestamp                       |

### `notifications`

| Column            | Type    | Description                              |
| ----------------- | ------- | ---------------------------------------- |
| `id`              | integer | Primary key                              |
| `match_id`        | integer | FK to `matches.id`                       |
| `channel`         | text    | `email`, `telegram`, or `in_app`         |
| `timing`          | text    | `day_before`, `match_day`, or `next_match` |
| `idempotency_key` | text    | Unique: `{match_id}_{channel}_{timing}`  |
| `status`          | text    | `sent`, `failed`, `read`                 |
| `title`           | text    | Notification title                       |
| `body`            | text    | Notification body content                |
| `error`           | text    | Error message if failed (nullable)       |
| `sent_at`         | text    | ISO 8601 timestamp                       |
| `read_at`         | text    | ISO 8601 timestamp (nullable)            |
| `created_at`      | text    | ISO 8601 timestamp                       |

**Idempotency**: The `idempotency_key` (`{match_id}_{channel}_{timing}`) has a unique constraint. This prevents duplicate notifications — if a cron job runs twice, the second insert is a no-op.

### `followed_teams`

| Column      | Type    | Description                              |
| ----------- | ------- | ---------------------------------------- |
| `team_key`  | text    | Primary key (`chelsea`, `argentina`)     |
| `enabled`   | integer | Toggle team on/off (0/1)                 |

---

## 4. API Integrations

### football-data.org v4

- **Endpoint**: `GET https://api.football-data.org/v4/teams/{teamId}/matches?status=SCHEDULED&limit=15`
- **Team IDs**: 61 (Chelsea FC), 762 (Argentina)
- **Headers**: `X-Auth-Token: {FOOTBALL_DATA_API_KEY}`
- **Usage**: Sync upcoming fixtures for all enabled followed teams. Upsert matches by `api_football_id`.
- **Status mapping**: `SCHEDULED`→`scheduled`, `IN_PLAY/PAUSED/LIVE`→`live`, `FINISHED`→`finished`, `POSTPONED/CANCELLED/ABANDONED`→`postponed`
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
      "path": "/api/cron/daily",
      "schedule": "0 12 * * *"
    }
  ]
}
```

### `daily` (once/day at 12:00 UTC) — CURRENT IMPLEMENTATION

Combined sync + notification endpoint:

1. Fetch upcoming fixtures for all enabled followed teams from football-data.org
2. Upsert into `matches` table by `api_football_id`
3. Read settings (timezone, enabled channels, configured hours)
4. Convert current UTC time to user's timezone
5. If current hour matches `day_before_hour`: find tomorrow's matches, dispatch notifications
6. If current hour matches `match_day_hour`: find today's matches, dispatch notifications
7. For each match + enabled channel, check `idempotency_key` before sending
8. Returns: `{ ok: true, upserted, processed, errors }`

### Standalone endpoints (available but not in vercel.json crons)

- `/api/cron/sync-matches` — fixture sync only
- `/api/cron/send-notifications` — notification dispatch only

All cron endpoints are protected by `CRON_SECRET` header validation (Vercel sends this automatically).

### Future cron improvement

Consider splitting back to separate crons with higher frequency:
- Sync: 3x/day (`0 6,14,22 * * *`) — catch schedule changes faster
- Notifications: hourly (`0 * * * *`) — don't miss notification windows

---

## 6. Notification Content

### Template

**Subject/Title**: `{team} vs {opponent} — {competition}` (or `{opponent} vs {team}` for away)

**Body**:
```
{competition_logo} {competition}
{team} {home_away_indicator} {opponent}
{match_date formatted to user timezone}
{venue}
```

The same content is adapted per channel:
- **Email**: HTML formatted with team logos
- **Telegram**: HTML parse mode with bold/italic
- **In-app**: Stored in `notifications` table, displayed in UI

---

## 7. UI Pages

### `/login` — Authentication

- Password-only form (single-user, no username)
- iron-session cookie-based authentication
- Redirects to dashboard on success
- Logout action available from nav

### `/` — Dashboard (route group: `(app)`)

- **Hero card**: Next match with opponent logo, competition, date/time (in user timezone), venue, countdown timer
- **Upcoming list**: Next 4 matches after the hero match, compact cards
- **Empty state**: "No upcoming matches" message when off-season

### `/upcoming-matches` — Full Match List (route group: `(app)`)

- Full list of upcoming matches (paginated, 5 per page)
- Manual refresh button to trigger fixture sync via server action

### `/settings` — Preferences (route group: `(app)`)

- **Followed teams**: Team crests with enable/disable toggles
- **Timezone**: Dropdown with 15 timezone options
- **Email**: Input field + enable/disable toggle
- **Telegram**: Chat ID input + enable/disable toggle + "Test notification" button
- **In-app**: Enable/disable toggle
- **Timing**: Day-before toggle + hour select, match-day toggle + hour select
- Auto-saves on change (debounced, no submit button)

### `/notifications` — History (route group: `(app)`)

- **List**: All sent notifications, newest first
- **Filters**: By channel (`email`, `telegram`, `in_app`), by status (`sent`, `failed`, `read`)
- **Mark as read**: Click to mark in-app notifications as read
- **Badge**: Unread count in navigation bar

---

## 8. Environment Variables

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key          |
| `TURSO_DATABASE_URL`    | Turso database URL                 |
| `DATABASE_URL`          | Fallback database URL              |
| `TURSO_AUTH_TOKEN`      | Turso auth token                   |
| `TELEGRAM_BOT_TOKEN`    | Telegram Bot API token             |
| `RESEND_API_KEY`        | Resend API key                     |
| `RESEND_FROM_DOMAIN`    | Domain for sending emails          |
| `CRON_SECRET`           | Secret for Vercel cron auth        |
| `SESSION_SECRET`        | iron-session encryption secret     |
| `LOGIN_PASSWORD`        | Password for single-user login     |

---

## 9. File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── login/
│   │   ├── page.tsx                        # Login form
│   │   └── actions.ts                      # Login server action
│   ├── actions/
│   │   └── logout.ts                       # Logout server action
│   ├── (app)/                              # Auth-protected route group
│   │   ├── layout.tsx                      # App layout with nav
│   │   ├── page.tsx                        # Dashboard
│   │   ├── notifications/
│   │   │   └── page.tsx                    # Notification history
│   │   ├── settings/
│   │   │   ├── page.tsx                    # Settings form
│   │   │   └── actions.ts                 # Settings server actions
│   │   └── upcoming-matches/
│   │       ├── page.tsx                    # Full match list
│   │       └── actions.ts                 # Sync server action
│   └── api/
│       ├── cron/
│       │   ├── daily/route.ts             # Combined sync + notify cron
│       │   ├── sync-matches/route.ts      # Standalone sync
│       │   └── send-notifications/route.ts # Standalone notifications
│       ├── notifications/
│       │   ├── route.ts                    # GET notifications
│       │   └── [id]/route.ts              # PATCH mark as read
│       └── settings/
│           └── route.ts                    # GET/PUT settings
├── components/
│   ├── countdown.tsx                       # Match countdown timer
│   ├── match-card.tsx                      # Match display card
│   ├── match-hero.tsx                      # Next match hero card
│   ├── nav.tsx                             # Navigation bar
│   ├── nav-links.tsx                       # Nav link items
│   ├── notification-filters.tsx            # Channel/status filter dropdowns
│   ├── notification-item.tsx               # Notification list item
│   ├── refresh-button.tsx                  # Manual sync button
│   ├── settings-form.tsx                   # Settings form component
│   ├── theme-provider.tsx                  # next-themes provider
│   └── ui/                                 # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── switch.tsx
│       └── table.tsx
├── hooks/
│   └── use-debounce.ts                     # Debounce hook for settings auto-save
├── lib/
│   ├── football-data.ts                    # football-data.org client
│   ├── notifications.ts                    # Notification dispatch logic
│   ├── resend.ts                           # Resend email client
│   ├── session.ts                          # iron-session config
│   ├── teams.ts                            # Team definitions + IDs
│   ├── telegram.ts                         # Telegram Bot client
│   └── utils.ts                            # cn() + date/timezone helpers
└── server/
    └── db/
        ├── index.ts                        # Drizzle client (Turso)
        ├── schema.ts                       # Drizzle schema definitions
        ├── queries.ts                      # Query helpers
        ├── seed.ts                         # Seed default settings row
        └── migrations/                     # Drizzle migration files
```

---

## 10. Implementation Sequence

### Done

1. ~~**Database layer** — Drizzle schema + Turso connection + seed settings row~~
2. ~~**API Football integration** — Client + sync cron endpoint~~
3. ~~**Dashboard UI** — Hero card + upcoming matches list + countdown~~
4. ~~**Settings page** — Form + API route + auto-save + followed teams~~
5. ~~**Notification dispatch** — Telegram + email + in-app clients, cron endpoint~~
6. ~~**Notification history UI** — List + filters + mark as read~~
7. ~~**Auth** — Login page + iron-session + route protection~~
8. ~~**Deploy + verify** — Environment variables, cron jobs~~

### Next Up

9. **Match results** — Display scores for finished matches, sync final scores in cron
10. **Postponement alerts** — Detect status changes and notify user
11. **Cron frequency** — Split daily cron into separate sync (3x/day) + notifications (hourly)
12. **Twilio integration** — WhatsApp/SMS channel (Phase 3)
