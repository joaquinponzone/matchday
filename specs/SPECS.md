# Matchday - Specifications

## 1. Overview

Multi-tenant notification system for Chelsea FC and Argentina national team matches. Syncs fixtures from football-data.org, stores them in Turso (SQLite), and dispatches notifications via Telegram and in-app.

Multi-user system with email/password login (iron-session + Bun.password). Admin-approved registration.

### Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-maia style)
- **Database**: Turso (SQLite) + Drizzle ORM
- **Hosting**: Vercel
- **Cron**: Vercel Cron Jobs
- **Messaging**: Telegram Bot API

---

## 2. Features

### MVP (Phase 1) — DONE

- [x] Sync Chelsea FC + Argentina fixtures from football-data.org
- [x] Dashboard showing next match hero + upcoming 4 matches
- [x] Upcoming matches page with full list + manual sync
- [x] Settings page (Telegram chat ID, timezone, notification preferences, followed teams)
- [x] Cron-based notification dispatch (day before + match day)
- [x] In-app notification history with filters and mark-as-read
- [x] Password-based login (iron-session)
- [x] Followed teams support (Chelsea FC + Argentina)
- [x] "Send test notification" button in settings (Telegram only)

### Phase 2 — User Management & Multi-Tenant (NEXT — Priority #1)

#### Auth Rewrite

- [ ] `users` table with email/password authentication (see §3 for schema)
- [ ] iron-session `SessionData` changes from `{ isLoggedIn: boolean }` to `{ userId: number }`
- [ ] Data Access Layer (`src/lib/dal.ts`): `verifySession()` cached with React `cache()`, `getUser()` helper — secure DB check for Server Components, Server Actions, and Route Handlers
- [ ] Login: email + password form, lookup user by email, verify with `Bun.password.verify()`, check user status before granting session
- [ ] Activate `src/proxy.ts` as real Next.js proxy (Node.js runtime, not Edge)
  - Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/cron/*`
  - All other routes require authenticated session
  - Optimistic check only (read session from cookie, no DB queries)
- [ ] Remove `ADMIN_PASSWORD` / `LOGIN_PASSWORD` env vars

#### Registration (Admin-Approved)

- [ ] `/register` page: email, name, password form (`useActionState` + Zod validation)
- [ ] Password hashed with `Bun.password.hash()` (bcrypt) before storage
- [ ] First registered user auto-becomes `admin` with status `active`
- [ ] Subsequent users created with status `pending`
- [ ] Telegram notification sent to all admins when a new registration request arrives
- [ ] Pending users see "account pending approval" message on login attempt

#### Password Reset (Resend)

- [ ] `/forgot-password` page: email input, sends reset link via Resend
- [ ] `/reset-password` page: new password form, accessed via token link
- [ ] Token: `crypto.randomBytes(32)`, hashed with SHA-256 before storage, 1 hour expiry
- [ ] Same success message shown regardless of whether email exists (prevent enumeration)
- [ ] Graceful degradation: "Forgot password?" link hidden if `RESEND_API_KEY` not configured

#### Admin Panel

- [ ] `/admin/users` page (in `(app)` route group, admin-only)
- [ ] List all users with status, role, and registration date
- [ ] Approve/reject pending user registrations
- [ ] Change user roles (admin/user)
- [ ] Admin can trigger password reset for any user

#### Multi-Tenant Schema Migration

- [ ] `settings`: replace singleton `id` PK with `userId` FK to users. One row per user, created on account approval
- [ ] `notifications`: add `userId` column. Idempotency key becomes `{user_id}_{match_id}_{channel}_{timing}`
- [ ] `followed_teams`: add `userId`, composite PK `(userId, teamKey)`
- [ ] `matches`: no changes (shared global data)

#### Cron Updates

- [ ] `processNotificationsForHour()` iterates all active users, checking each user's settings and followed teams
- [ ] Fixture sync uses union of all users' followed teams

### Phase 3 — Match Results & Alerts

- [ ] Show match results (scores) after games finish
  - Schema already supports `chelsea_score` / `opponent_score` fields and `finished` status
  - Needs: UI to display results, cron to sync finished match scores
- [ ] Notifications for postponed/rescheduled matches
  - Schema already supports `postponed` status
  - Needs: detection logic in cron + notification template

### Phase 4 — Future

- [ ] Push notifications
- [ ] Multi-team support (choose from all API teams, not just hardcoded two)

---

## 3. Data Model

### `users`

| Column                   | Type    | Description                              |
| ------------------------ | ------- | ---------------------------------------- |
| `id`                     | integer | Primary key (autoincrement)              |
| `email`                  | text    | Unique, user's email address             |
| `name`                   | text    | Display name                             |
| `password_hash`          | text    | bcrypt hash via `Bun.password`           |
| `role`                   | text    | `admin` or `user`                        |
| `status`                 | text    | `pending`, `active`, or `rejected`       |
| `reset_token`            | text    | SHA-256 hash of reset token (nullable)   |
| `reset_token_expires_at` | text    | ISO 8601 expiry timestamp (nullable)     |
| `created_at`             | text    | ISO 8601 timestamp                       |
| `updated_at`             | text    | ISO 8601 timestamp                       |

### `settings` (one row per user)

| Column                    | Type    | Description                              |
| ------------------------- | ------- | ---------------------------------------- |
| `user_id`                 | integer | Primary key, FK to `users.id`            |
| `telegram_chat_id`        | text    | Telegram chat ID                         |
| `timezone`                | text    | User timezone (e.g. `America/Argentina/Buenos_Aires`) |
| `telegram_enabled`        | integer | Toggle Telegram channel (0/1)            |
| `in_app_enabled`          | integer | Toggle in-app notifications (0/1)        |
| `notify_day_before`       | integer | Toggle day-before notification (0/1)     |
| `notify_match_day`        | integer | Toggle match-day notification (0/1)      |
| `day_before_hour`         | integer | Hour to send day-before notification (0-23, in user timezone). Default: 20 |
| `match_day_hour`          | integer | Hour to send match-day notification (0-23, in user timezone). Default: 9 |
| `created_at`              | text    | ISO 8601 timestamp                       |
| `updated_at`              | text    | ISO 8601 timestamp                       |

### `matches` (shared global data)

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
| `user_id`         | integer | FK to `users.id`                         |
| `match_id`        | integer | FK to `matches.id`                       |
| `channel`         | text    | `telegram` or `in_app`                   |
| `timing`          | text    | `day_before` or `match_day`              |
| `idempotency_key` | text    | Unique: `{user_id}_{match_id}_{channel}_{timing}` |
| `status`          | text    | `sent`, `failed`, `read`                 |
| `title`           | text    | Notification title                       |
| `body`            | text    | Notification body content                |
| `error`           | text    | Error message if failed (nullable)       |
| `sent_at`         | text    | ISO 8601 timestamp                       |
| `read_at`         | text    | ISO 8601 timestamp (nullable)            |
| `created_at`      | text    | ISO 8601 timestamp                       |

**Idempotency**: The `idempotency_key` (`{user_id}_{match_id}_{channel}_{timing}`) has a unique constraint. This prevents duplicate notifications — if a cron job runs twice, the second insert is a no-op.

### `followed_teams`

| Column      | Type    | Description                              |
| ----------- | ------- | ---------------------------------------- |
| `user_id`   | integer | FK to `users.id`, part of composite PK   |
| `team_key`  | text    | Team identifier, part of composite PK (`chelsea`, `argentina`) |
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
- **Admin notifications**: Registration requests are sent to all admin users who have Telegram configured and enabled.

### Resend (Email)

- **SDK**: `resend` npm package
- **Usage**: Password reset emails only
- **From**: `noreply@{RESEND_FROM_DOMAIN}`
- **Graceful degradation**: If `RESEND_API_KEY` is not set, forgot password link is hidden in the UI

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

1. Fetch upcoming fixtures for the union of all active users' followed teams from football-data.org
2. Upsert into `matches` table by `api_football_id`
3. For each active user: read their settings (timezone, enabled channels, configured hours)
4. Convert current UTC time to user's timezone
5. If current hour matches `day_before_hour`: find tomorrow's matches for user's followed teams, dispatch notifications
6. If current hour matches `match_day_hour`: find today's matches for user's followed teams, dispatch notifications
7. For each match + user + enabled channel, check `idempotency_key` before sending
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
- **Telegram**: HTML parse mode with bold/italic
- **In-app**: Stored in `notifications` table, displayed in UI

---

## 7. UI Pages

### `/login` — Authentication

- Email + password form
- iron-session cookie-based authentication (stores `{ userId }`)
- Verify password with `Bun.password.verify()`, check user status is `active`
- Pending users see "account pending approval" message
- Rejected users see "account not approved" message
- "Forgot password?" link (hidden if `RESEND_API_KEY` not configured)
- "Create an account" link to `/register`
- Redirects to dashboard on success
- Logout action available from nav

### `/register` — Registration

- Email, name, password form
- Password strength validation (min 8 chars)
- First user auto-becomes admin with status `active`, redirected to login
- Subsequent users created with status `pending`, shown confirmation message
- Telegram notification sent to all admins on new registration
- Link back to `/login`

### `/forgot-password` — Password Reset Request

- Email input form
- Always shows "If an account exists, we've sent a reset link" (prevent enumeration)
- Sends reset email via Resend with tokenized link to `/reset-password?token=...`
- Token: `crypto.randomBytes(32)`, SHA-256 hashed before DB storage, 1 hour expiry
- Link back to `/login`

### `/reset-password` — Set New Password

- Accessed via `/reset-password?token=...` link from email
- New password + confirm password form
- Validates token exists, matches hash in DB, and hasn't expired
- Updates password hash, clears reset token
- Redirects to `/login` with success message

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
- **Telegram**: Chat ID input + enable/disable toggle + "Test notification" button
- **In-app**: Enable/disable toggle
- **Timing**: Day-before toggle + hour select, match-day toggle + hour select
- Auto-saves on change (debounced, no submit button)

### `/notifications` — History (route group: `(app)`)

- **List**: All sent notifications for the current user, newest first
- **Filters**: By channel (`telegram`, `in_app`), by status (`sent`, `failed`, `read`)
- **Mark as read**: Click to mark in-app notifications as read
- **Badge**: Unread count in navigation bar

### `/admin/users` — User Management (route group: `(app)`, admin-only)

- **User list**: All users with email, name, role, status, and registration date
- **Pending queue**: Approve or reject pending registrations (approved users get a settings row created automatically)
- **Role management**: Toggle admin/user role for any user
- **Password reset**: Admin can trigger a password reset for any user
- **Access control**: Only visible to users with `admin` role; non-admins get 403

---

## 8. Environment Variables

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key          |
| `TURSO_DATABASE_URL`    | Turso database URL                 |
| `DATABASE_URL`          | Fallback database URL              |
| `TURSO_AUTH_TOKEN`      | Turso auth token                   |
| `TELEGRAM_BOT_TOKEN`    | Telegram Bot API token             |
| `CRON_SECRET`           | Secret for Vercel cron auth        |
| `SESSION_SECRET`        | iron-session encryption secret     |
| `RESEND_API_KEY`        | Resend API key for password reset emails (optional — forgot password hidden if absent) |
| `RESEND_FROM_DOMAIN`    | Sender domain for Resend emails (e.g. `matchday.example.com`) |
| `APP_URL`               | Public app URL for password reset links (e.g. `https://matchday.example.com`) |

---

## 9. File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── login/
│   │   ├── page.tsx                        # Login form (email + password)
│   │   └── actions.ts                      # Login server action
│   ├── register/
│   │   ├── page.tsx                        # Registration form
│   │   └── actions.ts                      # Register server action
│   ├── forgot-password/
│   │   ├── page.tsx                        # Password reset request form
│   │   └── actions.ts                      # Send reset email action
│   ├── reset-password/
│   │   ├── page.tsx                        # New password form (token-based)
│   │   └── actions.ts                      # Reset password action
│   ├── actions/
│   │   └── logout.ts                       # Logout server action
│   ├── (app)/                              # Auth-protected route group
│   │   ├── layout.tsx                      # App layout with nav
│   │   ├── page.tsx                        # Dashboard
│   │   ├── admin/
│   │   │   └── users/
│   │   │       ├── page.tsx               # User management (admin-only)
│   │   │       └── actions.ts             # Approve/reject/role change actions
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
│   ├── dal.ts                              # Data Access Layer: verifySession(), getUser() (cached)
│   ├── email.ts                            # Resend client for password reset emails
│   ├── football-data.ts                    # football-data.org client
│   ├── notifications.ts                    # Notification dispatch logic
│   ├── session.ts                          # iron-session config (SessionData: { userId })
│   ├── teams.ts                            # Team definitions + IDs
│   ├── telegram.ts                         # Telegram Bot client
│   └── utils.ts                            # cn() + date/timezone helpers
├── proxy.ts                                # Next.js proxy (optimistic auth gate, public routes)
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
5. ~~**Notification dispatch** — Telegram + in-app clients, cron endpoint~~
6. ~~**Notification history UI** — List + filters + mark as read~~
7. ~~**Auth** — Login page + iron-session + route protection~~
8. ~~**Deploy + verify** — Environment variables, cron jobs~~

### Next Up — User Management & Multi-Tenant (Phase 2)

9. **Users table + Drizzle schema** — Add `users` table, update `settings` (userId PK), `notifications` (+userId), `followed_teams` (+userId composite PK). Generate migration.
10. **DAL + session** — Create `src/lib/dal.ts` with `verifySession()` (React `cache()`), `getUser()`. Update `src/lib/session.ts` SessionData to `{ userId: number }`.
11. **Proxy** — Activate `src/proxy.ts` as real Next.js proxy (Node.js runtime). Optimistic cookie check only. Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/cron/*`.
12. **Registration flow** — `/register` page + server action. First user → admin/active, subsequent → user/pending. Telegram notification to admins on new registration.
13. **Login rewrite** — Update `/login` to email + password, `Bun.password.verify()`, check user status. Add links to register + forgot password.
14. **Password reset** — `src/lib/email.ts` (Resend client), `/forgot-password` + `/reset-password` pages. Token generation, hashing, expiry validation. Graceful degradation without `RESEND_API_KEY`.
15. **Admin panel** — `/admin/users` page. List users, approve/reject pending, change roles, trigger password reset.
16. **Multi-tenant queries** — Update all queries to scope by userId. Settings CRUD, notification fetching, followed teams — all user-scoped.
17. **Cron multi-tenant** — Update `processNotificationsForHour()` to iterate active users. Fixture sync uses union of all followed teams.
18. **Cleanup** — Remove `ADMIN_PASSWORD`/`LOGIN_PASSWORD` env vars, update seed script, verify all cross-references.

### Later

19. **Match results** — Display scores for finished matches, sync final scores in cron
20. **Postponement alerts** — Detect status changes and notify user
21. **Cron frequency** — Split daily cron into separate sync (3x/day) + notifications (hourly)
