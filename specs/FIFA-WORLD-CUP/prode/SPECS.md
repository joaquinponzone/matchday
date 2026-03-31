# Prode — FIFA World Cup 2026

Sistema de pronósticos partido por partido para la Copa del Mundo 2026. Todos los usuarios registrados participan en un pool compartido, predicen marcadores de cada partido y acumulan puntos en un ranking global.

---

## Modelo de datos

### Tabla `prode_predictions`

```sql
CREATE TABLE prode_predictions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  match_number INTEGER NOT NULL,   -- campo "match" del 2026.json (1–104)
  home_score   INTEGER NOT NULL,   -- goles predichos equipo local
  away_score   INTEGER NOT NULL,   -- goles predichos equipo visitante
  points       INTEGER,            -- null = partido no terminó / no calculado aún
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, match_number)
);
```

**Notas:**
- `match_number` usa el campo `match` del `2026.json` como identificador estable (1–104).
- `points` se llena post-partido; `null` indica predicción pendiente de calcular.
- Un único pool: todos los usuarios activos compiten entre sí.

---

## Lógica de puntuación

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto | **3 pts** |
| Resultado correcto (1X2 — ganador o empate) | **1 pt** |
| Resultado incorrecto | **0 pts** |

**Ejemplos:**
- Real: 2-1 / Predicción: 2-1 → **3 pts** (exacto)
- Real: 2-1 / Predicción: 1-0 → **1 pt** (acertó que ganó local)
- Real: 2-1 / Predicción: 0-2 → **0 pts**

---

## Lock de predicciones

- Una predicción **no puede crearse ni modificarse** una vez que el partido empezó (`new Date() >= matchDate`).
- La lógica de lock se aplica en el Server Action (backend) y en la UI (deshabilitar inputs + mostrar estado bloqueado).

---

## Obtención de resultados reales

Los resultados reales vienen de la **FIFA API** (`src/lib/fifa.ts`):

- Revisar si `fetchWCGroupMatches()` ya incluye scores en el payload cuando el partido está terminado.
- Si es necesario, extender el tipo `WCMatch` en `types.ts` con `homeScore` / `awayScore`.
- Para fase knockout, misma lógica. Los marcadores de knockout son al final del tiempo reglamentario (90 min).

---

## Estructura de archivos

```
src/
├── app/
│   └── (app)/
│       └── world-cup/
│           ├── prode/
│           │   ├── page.tsx              # Página principal del prode (SSR)
│           │   ├── predictions-list.tsx  # Lista de partidos con inputs de marcador [client]
│           │   ├── leaderboard.tsx       # Ranking de usuarios [server]
│           │   └── actions.ts            # Server Actions: save/update prediction
│           └── wc-tabs.tsx               # + nueva tab "Prode"
├── server/
│   └── db/
│       ├── schema.ts                     # + tabla prode_predictions
│       └── queries.ts                    # + queries de prode
```

---

## Páginas y UI

### Tab "Prode" en `/world-cup`

Nueva tab en `wc-tabs.tsx` que embebe la página de prode.

---

### `/world-cup/prode` — Página principal

```
[ Mi posición: #2 · 47 pts ]

[ Tabs: Predicciones | Ranking ]
```

---

### Tab "Predicciones" — `predictions-list.tsx`

Lista de todos los partidos del Mundial agrupados por ronda (Fase de Grupos, Octavos, Cuartos, etc.).

**Cada partido muestra:**
- Fecha y hora (timezone del usuario)
- Bandera + nombre equipo local | Bandera + nombre equipo visitante
- Inputs: `[ home ] - [ away ]` (numéricos)
- Estados:
  - **Editable**: inputs activos, botón guardar
  - **Locked** (partido empezó, predicción guardada): marcador predicho en read-only
  - **Locked** (partido empezó, sin predicción): chip "No jugaste este partido"
  - **Con resultado**: resultado real + badge de puntos (`+3` / `+1` / `+0`)

**Visibilidad cross-user:** Las predicciones de otros usuarios para un partido son visibles **solo después del kickoff** de ese partido.

---

### Tab "Ranking" — `leaderboard.tsx`

| # | Usuario | Total | Exactos | Correctos |
|---|---------|-------|---------|-----------|
| 1 | Juan    | 89    | 8       | 25        |
| 2 | María   | 76    | 6       | 28        |

- **Total** = puntos acumulados
- **Exactos** = cantidad de marcadores exactos (+3)
- **Correctos** = cantidad de resultados 1X2 acertados (+1, sin contar exactos)

Desempate: por `exactCount`; si sigue igual, por timestamp de última predicción.

---

## Server Actions (`prode/actions.ts`)

### `savePrediction(matchNumber, homeScore, awayScore)`

```
1. getUser() — verificar sesión
2. Buscar partido en 2026.json por matchNumber → obtener matchDate
3. Si new Date() >= matchDate → error "El partido ya comenzó"
4. Upsert en prode_predictions (INSERT OR REPLACE)
5. Return { success: true }
```

---

## Queries DB (`queries.ts`)

```ts
// Predicciones del usuario
getUserPredictions(userId: number): Promise<ProdePrediction[]>

// Predicciones de todos los usuarios para un partido (post-kickoff)
getMatchPredictions(matchNumber: number): Promise<(ProdePrediction & { userName: string })[]>

// Ranking global
getProdeLeaderboard(): Promise<{
  userId: number
  name: string
  totalPoints: number
  exactCount: number
  correctCount: number
}[]>

// Calcular y persistir puntos post-partido
calculateMatchPoints(
  matchNumber: number,
  realHome: number,
  realAway: number
): Promise<void>
```

---

## Cron — Cálculo automático de puntos

Extender el cron diario (`/api/cron/daily`):

```
1. [existente] Sync fixtures
2. [existente] Enviar notificaciones
3. [nuevo] Para cada partido terminado con predicciones sin puntuar (points IS NULL):
   a. Obtener marcador real de FIFA API
   b. Llamar calculateMatchPoints(matchNumber, realHome, realAway)
```

---

## Migración

```sql
CREATE TABLE prode_predictions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  match_number INTEGER NOT NULL,
  home_score   INTEGER NOT NULL,
  away_score   INTEGER NOT NULL,
  points       INTEGER,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id, match_number)
);
```

---

## Consideraciones

- **Fase knockout con alargue/penales:** La predicción es sobre el resultado al final del tiempo reglamentario (90 min). Si hay empate y se define por penales, el "empate" en 90 min se usa para el 1X2.
- **Partidos suspendidos/reprogramados:** Las predicciones quedan en espera (`points = null`); no se anulan.
- **Usuarios sin predicción:** No suman ni restan; no aparecen en el ranking hasta hacer al menos una predicción.

---

## Estado de implementación

- [ ] Schema: tabla `prode_predictions` + migración
- [ ] Queries: `getUserPredictions`, `getMatchPredictions`, `getProdeLeaderboard`, `calculateMatchPoints`
- [ ] Server Action: `savePrediction` con lock por kickoff
- [ ] UI: `predictions-list.tsx` — lista de partidos con inputs de marcador
- [ ] UI: `leaderboard.tsx` — tabla de ranking
- [ ] UI: `prode/page.tsx` — página con tabs Predicciones / Ranking
- [ ] Integration: nueva tab "Prode" en `wc-tabs.tsx`
- [ ] Cron: extender daily cron con cálculo de puntos post-partido
- [ ] FIFA API: verificar/extender `WCMatch` type para incluir scores reales
