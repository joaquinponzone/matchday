# A personal system to get notified about Chelsea FC matches

## Features

- [x] Config your preferences
    - [x] Your Telegram chat ID
    - [x] Your preferred notification channels (Telegram, in-app)
    - [x] Your timezone
    - [x] Notification timing (day before / match day)
- [x] Get notified about next 5 Chelsea FC matches
    - [x] Through Telegram Bot API
    - [x] In app-notifications
- [x] Dashboard with next match countdown and upcoming matches
- [x] Notifications page with filters (channel, status) and mark-as-read
- [x] Followed teams (Chelsea FC + Argentina)
- [x] Password-based login (iron-session)

## Technologies

- [x] Next.js (v16, App Router, React 19)
- [x] Tailwind CSS (v4)
- [x] Shadcn/UI (radix-maia style)
- [x] SQLite
- [x] Drizzle ORM
- [x] Vercel
- [x] Vercel Cron (daily at 12:00 UTC)
- [x] Turso

## Integrations

- [x] football-data.org: https://www.football-data.org/documentation/quickstart
- [x] Turso: https://turso.tech/
- [x] Telegram Bot API

# Future Enhancements

- [ ] Show match results (scores) after games finish
- [ ] Support multi-tenant. Now thers an iron session for one user. So we need to add a way to support multiple users with different settings for each one.
- [ ] Support multiple teams (Clubs and National Teams). Now we only support Chelsea FC and AFA (Argentina). So we need to add a way to support choose between multiple teams from the API.
