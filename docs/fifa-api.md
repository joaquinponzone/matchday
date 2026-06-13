# FIFA API — Datos del Mundial 2026

Guía de uso de la API pública (no oficial) de FIFA para obtener standings,
calendario y resultados de la FIFA World Cup 2026. Es la fuente que usa el
módulo World Cup del proyecto (`src/lib/fifa.ts`).

> ⚠️ Es una API **no documentada y no oficial**. No requiere API key, pero
> puede cambiar sin aviso. Por eso todas las funciones del proyecto envuelven
> los fetch en `try/catch` y devuelven `[]` ante cualquier error.

## Base URL e identificadores

```
https://api.fifa.com/api/v3
```

| Constante         | Valor      | Descripción                          |
| ----------------- | ---------- | ------------------------------------ |
| `COMPETITION_ID`  | `17`       | FIFA World Cup                       |
| `SEASON_ID`       | `285023`   | Edición 2026                         |
| `STAGE_ID`        | `289273`   | Etapa (usada para el feed de Standing) |

Definidos en `src/lib/fifa.ts`:

```ts
const FIFA_BASE = "https://api.fifa.com/api/v3"
const COMPETITION_ID = "17"
const SEASON_ID = "285023"
const STAGE_ID = "289273"
```

### Parámetro `language`

Casi todos los endpoints aceptan `?language=es`. Aun así, los strings vienen
como arreglos de objetos localizados (ver [Strings localizados](#strings-localizados)),
así que conviene resolver el locale a mano.

## Endpoints

### 1. Standings (tabla de posiciones por grupo)

```
GET /calendar/{COMPETITION_ID}/{SEASON_ID}/{STAGE_ID}/Standing?language=es
```

Ejemplo:

```
https://api.fifa.com/api/v3/calendar/17/285023/289273/Standing?language=es
```

Respuesta (`FIFAStandingsResponse`):

```jsonc
{
  "Results": [
    {
      "IdGroup": "...",
      "IdTeam": "...",
      "Group": [{ "Locale": "es-ES", "Description": "Grupo A" }],
      "Position": 1,
      "Played": 3,
      "Won": 2,
      "Drawn": 1,
      "Lost": 0,
      "For": 5,
      "Against": 2,
      "GoalsDiference": 3,   // ojo: typo en la API ("Diference")
      "Points": 7,
      "Team": {
        "IdTeam": "...",
        "Name": [{ "Locale": "es-ES", "Description": "Argentina" }],
        "ShortClubName": "Argentina",
        "Abbreviation": "ARG",
        "PictureUrl": "https://.../{format}/{size}/...png",
        "IdConfederation": "CONMEBOL"
      }
    }
  ]
}
```

Notas:
- `GoalsDiference` está escrito así (typo de la API), no `GoalsDifference`.
- `IdTeam` puede venir en la fila y/o dentro de `Team`; conviene tomar el primero
  que exista y, como último recurso, derivar un id de `Abbreviation + ShortClubName`.
- Las filas vienen planas; hay que agrupar por `IdGroup` para armar la tabla.

Funciones que lo consumen:
- `fetchWCStandings()` → `GroupStanding[]` (agrupado por grupo, ordenado por `Position`).
- `fetchFifaWCNationalTeamsForSearch()` → lista deduplicada de selecciones (para búsqueda).

### 2. Calendario / partidos (paginado)

```
GET /calendar/matches?idCompetition=17&idSeason=285023&count=200&language=es
```

Parámetros:

| Param               | Valor      | Notas                                          |
| ------------------- | ---------- | ---------------------------------------------- |
| `idCompetition`     | `17`       | Requerido                                      |
| `idSeason`          | `285023`   | Requerido                                      |
| `count`             | `200`      | Tamaño de página (máximo razonable)            |
| `language`          | `es`       | Opcional                                       |
| `continuationToken` | `string`   | Para la siguiente página (ver paginación)      |

Respuesta (`FIFAMatchesResponse`):

```jsonc
{
  "ContinuationToken": "abc123...",   // null cuando no hay más páginas
  "Results": [
    {
      "IdGroup": "...",                // null en fase eliminatoria
      "GroupName": [{ "Locale": "es-ES", "Description": "Grupo A" }],
      "StageName": [{ "Locale": "es-ES", "Description": "Octavos de final" }],
      "MatchNumber": 1,
      "Date": "2026-06-11T20:00:00Z",
      "TimeDefined": true,
      "MatchStatus": 1,                // 0=finalizado, 1=por jugar, 3=en vivo
      "HomeTeamScore": null,
      "AwayTeamScore": null,
      "Home": {
        "TeamName": [{ "Locale": "es-ES", "Description": "México" }],
        "ShortClubName": "Mexico",
        "Abbreviation": "MEX",
        "PictureUrl": "https://.../{format}/{size}/...png"
      },
      "Away": { /* idem Home, o null si aún no hay rival */ },
      "Stadium": {
        "Name": [{ "Locale": "es-ES", "Description": "Estadio Azteca" }],
        "CityName": [{ "Locale": "es-ES", "Description": "Ciudad de México" }]
      },
      "PlaceHolderA": "Ganador Grupo A",  // usado cuando Home/Away es null
      "PlaceHolderB": "2º Grupo B"
    }
  ]
}
```

#### Paginación con `continuationToken`

El endpoint pagina. Se itera hasta que `ContinuationToken` venga `null`:

```ts
async function fetchRawWCMatches(): Promise<FIFAMatch[]> {
  const allMatches: FIFAMatch[] = []
  let token: string | null = null

  do {
    const url = new URL(`${FIFA_BASE}/calendar/matches`)
    url.searchParams.set("idCompetition", COMPETITION_ID)
    url.searchParams.set("idSeason", SEASON_ID)
    url.searchParams.set("count", "200")
    url.searchParams.set("language", "es")
    if (token) url.searchParams.set("continuationToken", token)

    const res = await fetch(url.toString())
    if (!res.ok) break

    const data: FIFAMatchesResponse = await res.json()
    allMatches.push(...data.Results)
    token = data.ContinuationToken
  } while (token)

  return allMatches
}
```

Funciones que lo consumen:
- `fetchWCGroupMatches()` → solo partidos de fase de grupos (`IdGroup !== null`).
- `fetchAllWCMatches()` → todos los partidos, ordenados por fecha.
- `fetchFinishedWCMatchScores()` → resultados de partidos finalizados (para el prode).

## Convenciones de los datos

### `MatchStatus`

| Valor | Significado |
| ----- | ----------- |
| `0`   | Finalizado  |
| `1`   | Por jugar   |
| `3`   | En vivo     |

Un partido se considera finalizado con resultado válido cuando
`MatchStatus === 0 && HomeTeamScore !== null && AwayTeamScore !== null`.

### Fase de grupos vs. eliminatoria

`IdGroup` distingue la fase:
- `IdGroup !== null` → fase de grupos; el nombre sale de `GroupName`.
- `IdGroup === null` → eliminatoria; el nombre sale de `StageName`, y los
  equipos pueden ser `null` (usar `PlaceHolderA` / `PlaceHolderB`).

### Strings localizados

Los campos de texto son arreglos `{ Locale, Description }`. Se resuelve con
preferencia `es-ES` → `en-GB` → primero disponible:

```ts
function getLocale(arr: LocalizedString[]): string {
  return (
    arr.find((x) => x.Locale === "es-ES")?.Description ??
    arr.find((x) => x.Locale === "en-GB")?.Description ??
    arr[0]?.Description ??
    ""
  )
}
```

> Aunque algunos nombres no traen `es-ES`, el proyecto mantiene un mapa
> `TEAM_NAME_ES` para traducir nombres de selecciones (ej. `"Brazil"` → `"Brasil"`).

### Banderas (`PictureUrl`)

Las URLs de imágenes traen placeholders `{format}` y `{size}` que hay que
reemplazar:

```ts
function getFlagUrl(pictureUrl: string | null): string | undefined {
  if (!pictureUrl) return undefined
  // sq = square, 3 = tamaño
  return pictureUrl.replace("{format}", "sq").replace("{size}", "3")
}
```

Formatos comunes: `sq` (cuadrada). Tamaños: `1`–`4` (mayor número, mayor resolución).

### Fechas

`Date` viene en ISO 8601 UTC (`2026-06-11T20:00:00Z`). El proyecto lo separa en
fecha (`YYYY-MM-DD`) y hora en UTC para mostrar.

## Caché y revalidación (Next.js)

En el proyecto los fetch usan caché de Next.js:

```ts
// Datos que cambian poco → revalida cada hora
fetch(url, { next: { revalidate: 3600 } })

// Resultados en vivo (cron sync) → sin caché
fetch(url, { cache: "no-store" })
```

`fetchFinishedWCMatchScores({ fresh: true })` usa `no-store` para el cron de
sincronización de resultados; el resto revalida cada 3600 s.

## Manejo de errores

La API no es oficial y puede fallar o cambiar de forma. Patrón usado en todo
`fifa.ts`:

```ts
export async function fetchWCStandings(): Promise<GroupStanding[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    // ...mapear
  } catch {
    return []   // nunca romper la UI por la fuente externa
  }
}
```

Siempre devolver una estructura vacía (`[]`) en vez de propagar el error, para
que la página del Mundial degrade con elegancia.

## Resumen de funciones (`src/lib/fifa.ts`)

| Función                              | Devuelve                          | Uso                                  |
| ------------------------------------ | --------------------------------- | ------------------------------------ |
| `fetchWCStandings()`                 | `GroupStanding[]`                 | Tabla de posiciones por grupo        |
| `fetchWCGroupMatches()`              | `WCMatch[]`                       | Partidos de fase de grupos           |
| `fetchAllWCMatches()`                | `WCMatch[]` (ordenado por fecha)  | Calendario completo                  |
| `fetchFinishedWCMatchScores(opts)`   | `{ matchNumber, homeScore, awayScore }[]` | Resultados para el prode      |
| `fetchFifaWCNationalTeamsForSearch()`| `FifaWcNationalTeamForSearch[]`   | Búsqueda de selecciones              |

## Cómo actualizar para otra edición

Si cambia el torneo/edición, actualizar los tres ids en `src/lib/fifa.ts`.
Para descubrir los valores correctos se puede inspeccionar el sitio oficial de
FIFA (red → llamadas a `api.fifa.com`) o probar el endpoint de competiciones:

```
GET https://api.fifa.com/api/v3/competitions/all?language=es
GET https://api.fifa.com/api/v3/seasons?idCompetition=17&language=es
```
