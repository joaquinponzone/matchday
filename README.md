# Matchday ⚽️

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
| Auth | iron-session + bcryptjs |
| Validación | zod |
| Fechas | date-fns |
| APIs externas | FIFA API (World Cup) · football-data.org (clubes) |

## Inicio rápido

### Requisitos

- [Bun](https://bun.sh/)
- [Turso](https://turso.tech/) database
- API keys:
  - [football-data.org](https://www.football-data.org/)
  - [Telegram Bot](https://core.telegram.org/bots#botfather)
  - [Resend](https://resend.com/) (opcional)

### Variables de entorno

Crear `.env.local`:

```env
# Base de datos
TURSO_DATABASE_URL=      # URL de Turso
TURSO_AUTH_TOKEN=        # Token de auth de Turso

# APIs externas
FOOTBALL_DATA_API_KEY=   # API key de football-data.org
TELEGRAM_BOT_TOKEN=      # Token del bot de Telegram
RESEND_API_KEY=          # API key de Resend (opcional)
RESEND_FROM_DOMAIN=      # Dominio para envío de emails (opcional)

# Seguridad
CRON_SECRET=             # Secret para autenticar cron de Vercel
SESSION_SECRET=          # Secret para iron-session
APP_URL=                 # URL de la app (para links en emails)
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
bun run dev              # Dev server (Turbopack)
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
│   │   ├── admin/            # Admin-only pages
│   │   │   └── users/        # Gestión de usuarios
│   │   └── world-cup/        # Mundial 2026
│   │       ├── page.tsx      # Posiciones, partidos, llave
│   │       └── prode/        # Predicciones y ranking
│   ├── api/
│   │   ├── cron/             # Cron jobs (sync + notificaciones)
│   │   ├── notifications/    # API de notificaciones
│   │   ├── settings/         # API de settings
│   │   └── teams/            # Team search
│   ├── login/                # Login
│   ├── register/             # Registro
│   ├── forgot-password/      # Recuperar contraseña
│   └── reset-password/       # Resetear contraseña
├── components/               # Componentes React (ui/ para shadcn)
├── hooks/                    # Custom hooks
├── lib/                      # Clientes de APIs + utilidades
│   ├── dal.ts                # Data Access Layer (sesión + auth)
│   ├── session.ts            # iron-session config
│   ├── fifa.ts               # Cliente FIFA API
│   ├── football-data.ts      # Cliente football-data.org
│   ├── telegram.ts           # Cliente Telegram Bot API
│   ├── email.ts              # Cliente Resend
│   ├── notifications.ts      # Lógica de despacho de notificaciones
│   ├── validations.ts        # Zod schemas
│   └── utils.ts              # cn(), formatMatchDate, formatTimeLeft
├── proxy.ts                  # Auth gate (middleware)
└── server/
    └── db/                   # Drizzle schema, queries, migraciones
        ├── schema.ts         # Definición de tablas
        ├── queries.ts        # Helpers de acceso a DB
        └── seed.ts           # Seed inicial
```

## DB Schema (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `users` | Multi-user auth (email, passwordHash, role, status) |
| `settings` | Preferencias de notificación por usuario |
| `matches` | Datos de partidos sincronizados |
| `notifications` | Log de notificaciones enviadas (idempotencia) |
| `followed_teams` | Suscripciones por usuario |
| `teams` | Datos de referencia de equipos (crest, tla) |
| `prode_predictions` | Predicciones de marcador por usuario (WC 2026) |

## Cron Jobs

Un cron diario corre a las 12:00 UTC (`/api/cron/daily`):

1. **Sync** — Sincroniza fixtures de football-data.org para los equipos seguidos
2. **Notificaciones** — Envía alertas según timezone y horarios configurados por cada usuario
3. **Prode** — Calcula puntos de predicciones para partidos terminados

## Convenciones

- **Server Components** por defecto. Usar `"use client"` solo cuando sea necesario.
- DB access via helpers en `src/server/db/queries.ts` — no queries raw de Drizzle en rutas.
- Auth via `src/lib/dal.ts` — usar `getUser()` / `verifySession()`.
- Path alias: `@/*` mapea a `src/*`.
- Estilo: double quotes, no semicolons, 2-space indent, 80 char width.
- Usar `cn()` de `@/lib/utils` para clases condicionales de Tailwind.
- Cron endpoints protegidos por header `CRON_SECRET`.
- Roles: `admin` \| `user`. Admin pages bajo `(app)/admin/`.
- User status: `pending` \| `active` \| `inactive`.

## Documentación

- [`docs/prode/README.md`](docs/prode/README.md) — Reglas y funcionamiento del prode
- [`specs/IDEA.md`](specs/IDEA.md) — Visión original del proyecto
- [`specs/SPECS.md`](specs/SPECS.md) — Especificación técnica completa
- [`specs/FIFA-WORLD-CUP/IDEA.md`](specs/FIFA-WORLD-CUP/IDEA.md) — Features del módulo WC 2026
- [`specs/FIFA-WORLD-CUP/prode/SPECS.md`](specs/FIFA-WORLD-CUP/prode/SPECS.md) — Especificación del prode

## License

Proyecto privado.
