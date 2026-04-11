# Fixtures: dashboard en vivo + cron diario

**Estado:** implementado (Abril 2026) — dashboard con fetch on-demand + TanStack Query; cron diario evalúa notificaciones con datos en vivo de Promiedos sin depender de filas en `matches` para la UI.

**Contexto:** Los partidos de clubes ya no se sincronizan a `matches` solo para pintar el home. El usuario ve próximos fixtures vía `GET /api/fixtures/upcoming` y caché en cliente; el cron `daily` corre notificaciones + prode FIFA.

**Relación con otros docs:** Fuente Promiedos en [specs/data-sources/option-2/SPECS.md](../data-sources/option-2/SPECS.md).

---

## Objetivos

1. **Dashboard (home):** próximos partidos con **llamada autenticada** a `GET /api/fixtures/upcoming`, sin filas previas en `matches` solo para UI.
2. **Cache en cliente:** **TanStack Query** (`staleTime`, refetch al foco) en [`src/components/dashboard-feed.tsx`](../../src/components/dashboard-feed.tsx); botón refrescar invalida la query ([`RefreshButton`](../../src/components/refresh-button.tsx)).
3. **Cron diario:** `GET /api/cron/daily` ejecuta `processDailyDigestNotifications` (Promiedos hoy/mañana por timezone agrupado) + cálculo prode FIFA. Un solo disparo programado en Vercel (hora a definir en `vercel.json`).

## No objetivos (en esta especificación)

- Sustituir el proveedor de datos (Promiedos); eso va en `data-sources`.
- Recordatorios a horas exactas distintas **solo** con el cron free: ver restricciones abajo.

---

## Restricción: un cron al día (Vercel free)

- Un disparo diario. `day_before_hour` / `match_day_hour` en settings no disparan corridas extra; el texto de notificación usa “hoy” / “mañana” según `timezone`.
- Para envíos a horas exactas hace falta otro mecanismo (cron pagado, cola, etc.).

---

## Arquitectura (implementada)


| Área            | Enfoque |
| --------------- | ------- |
| Vista dashboard | `DashboardFeed` + `useQuery` → `/api/fixtures/upcoming` → [`getUpcomingFixturesForUser`](../../src/lib/upcoming-fixtures.ts) |
| Cron            | [`processDailyDigestNotifications`](../../src/lib/notifications.ts): fetch Promiedos por TZ, filtro por `followed_teams`, idempotencia `userId_externalMatchId_teamKey_channel_timing`; `match_id` en notificaciones nullable ([migración 0007](../../src/server/db/migrations/0007_notifications_nullable_match.sql)). |
| Tabla `matches` | No usada para el listado del home; puede quedar en el esquema sin sync masivo desde Promiedos. |
| Rutas legacy | `sync-matches`, `send-notifications` responden `deprecated: true` (evitar duplicar envíos si ambos estaban en Vercel). |

---

## Puntos abiertos

- Definir hora exacta del cron (UTC) en `vercel.json` y documentarla aquí.
- Opcional: `unstable_cache` en servidor para `/api/fixtures/upcoming` si hace falta aliviar Promiedos.
- Rate limits: ajustar `PROMIEDOS_UPCOMING_DAYS_FORWARD` / ventana de notificaciones si el proveedor limita.

---

## Referencias en código

| Pieza | Ubicación |
| ----- | -------- |
| Upcoming fixtures | [`src/lib/upcoming-fixtures.ts`](../../src/lib/upcoming-fixtures.ts) |
| API | [`src/app/api/fixtures/upcoming/route.ts`](../../src/app/api/fixtures/upcoming/route.ts) |
| Query provider | [`src/app/(app)/query-provider.tsx`](../../src/app/(app)/query-provider.tsx) |
| Notificaciones diarias | [`src/lib/notifications.ts`](../../src/lib/notifications.ts) |
| Cron daily | [`src/app/api/cron/daily/route.ts`](../../src/app/api/cron/daily/route.ts) |
