# Matchday

App para seguir el Mundial 2026 con amigos. Posiciones en vivo, fixture completo, llave de eliminación y un **prode** para competir con predicciones partido por partido.

También recibís notificaciones por Telegram de los partidos de Chelsea y la Selección Argentina.

## Features

- **World Cup 2026** — Posiciones de grupos, partidos y llave de eliminación con datos en vivo de la FIFA API
- **Prode** — Pronosticá marcadores, sumá puntos y competí en el ranking contra tus amigos ([ver reglas](docs/prode/README.md))
- **Dashboard** — Countdown al próximo partido + próximos partidos de tus equipos
- **Notificaciones** — Alertas automáticas por Telegram e in-app (día anterior y día del partido)
- **Multi-equipo** — Seguí a Chelsea FC y la Selección Argentina
- **Multi-usuario** — Registro con aprobación de admin, roles, gestión de usuarios

## Tech Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Runtime | Bun |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Base de datos | Turso (SQLite) + Drizzle ORM |
| Hosting | Vercel (+ cron jobs) |
| Mensajería | Telegram Bot API |
| Email | Resend |
| Auth | iron-session (email + password) |
| APIs externas | FIFA API (World Cup) · football-data.org (clubes) |

## Inicio rápido

### Requisitos

- [Bun](https://bun.sh/)
- [Turso](https://turso.tech/) database
- API keys: [football-data.org](https://www.football-data.org/), [Telegram Bot](https://core.telegram.org/bots#botfather), [Resend](https://resend.com/) (opcional)

### Variables de entorno

Crear `.env.local`:

```env
TURSO_DATABASE_URL=      # URL de Turso
TURSO_AUTH_TOKEN=        # Token de auth de Turso
FOOTBALL_DATA_API_KEY=   # API key de football-data.org
TELEGRAM_BOT_TOKEN=      # Token del bot de Telegram
CRON_SECRET=             # Secret para autenticar cron de Vercel
SESSION_SECRET=          # Secret para iron-session
APP_URL=                 # URL de la app (para links en emails)
RESEND_API_KEY=          # API key de Resend (opcional)
RESEND_FROM_DOMAIN=      # Dominio para envío de emails (opcional)
```

### Setup

```bash
bun install              # Instalar dependencias
bun run db:push          # Pushear schema a Turso
bun run db:seed          # Seed de settings por defecto
bun run dev              # Levantar dev server (Turbopack)
```

El primer usuario que se registre queda como **admin** automáticamente.

## Scripts

```bash
bun run dev              # Dev server
bun run build            # Build de producción
bun run lint             # ESLint
bun run format           # Prettier
bun run typecheck        # TypeScript check
bun run db:generate      # Generar migraciones Drizzle
bun run db:push          # Pushear schema a Turso
bun run db:seed          # Seed de datos iniciales
bun run db:studio        # Drizzle Studio
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (app)/                # Rutas protegidas (auth)
│   │   ├── page.tsx          # Dashboard
│   │   ├── notifications/    # Historial de notificaciones
│   │   ├── settings/         # Preferencias del usuario
│   │   ├── admin/users/      # Gestión de usuarios (admin)
│   │   └── world-cup/        # Mundial 2026
│   │       ├── page.tsx      # Posiciones, partidos, llave
│   │       └── prode/        # Predicciones y ranking
│   ├── api/
│   │   ├── cron/             # Cron jobs (sync + notificaciones)
│   │   ├── notifications/    # API de notificaciones
│   │   └── settings/         # API de settings
│   ├── login/                # Login
│   ├── register/             # Registro
│   ├── forgot-password/      # Recuperar contraseña
│   └── reset-password/       # Resetear contraseña
├── components/               # Componentes React (ui/ para shadcn)
├── hooks/                    # Custom hooks
├── lib/                      # Clientes de APIs + utilidades
│   ├── dal.ts                # Data Access Layer (sesión + auth)
│   ├── fifa.ts               # Cliente FIFA API
│   ├── football-data.ts      # Cliente football-data.org
│   ├── telegram.ts           # Cliente Telegram Bot API
│   └── notifications.ts      # Lógica de despacho de notificaciones
├── proxy.ts                  # Auth gate (middleware)
└── server/
    └── db/                   # Drizzle schema, queries, migraciones
```

## Cron Jobs

Un cron diario corre a las 12:00 UTC (`/api/cron/daily`):

1. **Sync** — Sincroniza fixtures de football-data.org para los equipos seguidos
2. **Notificaciones** — Envía alertas según timezone y horarios configurados por cada usuario
3. **Prode** — Calcula puntos de predicciones para partidos terminados

## Docs

- [`docs/prode/`](docs/prode/README.md) — Reglas y funcionamiento del prode

## License

Proyecto privado.
