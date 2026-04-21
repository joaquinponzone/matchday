import type { LiveFixture } from "@/lib/fixture.types"

/** Base URL for Promiedos JSON API (override with PROMIEDOS_API_BASE). */
export const PROMIEDOS_API_BASE =
  process.env.PROMIEDOS_API_BASE ?? "https://api.promiedos.com.ar"

/** Public website base for deep links (override with PROMIEDOS_WEB_BASE). */
export const PROMIEDOS_WEB_BASE =
  process.env.PROMIEDOS_WEB_BASE ?? "https://www.promiedos.com.ar"

/** Default X-VER; set PROMIEDOS_X_VER when the API stops accepting this. */
const DEFAULT_PROMIEDOS_X_VER = "1.11.7.5"

/** Promiedos uses Argentina time for `start_time` without offset. */
export const PROMIEDOS_WALL_CLOCK_TIMEZONE = "America/Argentina/Buenos_Aires"

/** Hours to add to wall-clock (ART) to get UTC (no DST in Argentina). */
const ART_OFFSET_HOURS_UTC = 3

export function getPromiedosHeaders(): Record<string, string> {
  return {
    "X-VER": process.env.PROMIEDOS_X_VER ?? DEFAULT_PROMIEDOS_X_VER,
    "User-Agent": "Matchday/1.0 (fixture sync)",
    Accept: "application/json",
  }
}

export interface PromiedosTeam {
  id: string
  name: string
  short_name: string
  url_name: string
  country_id?: string
}

export interface PromiedosGame {
  id: string
  teams: PromiedosTeam[]
  start_time: string
  status: { enum: number; name: string; short_name?: string }
  url_name: string
  winner?: number
}

export interface PromiedosLeague {
  name: string
  id: string
  url_name: string
  country_name?: string
  games: PromiedosGame[]
}

export interface PromiedosGamesResponse {
  leagues: PromiedosLeague[]
}

function promiedosUrl(path: string): string {
  const base = PROMIEDOS_API_BASE.replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

async function promiedosFetch(path: string): Promise<Response> {
  return fetch(promiedosUrl(path), {
    headers: getPromiedosHeaders(),
    cache: "no-store",
  })
}

export function formatPromiedosGamesDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date)
  const d = parts.find((p) => p.type === "day")?.value ?? "01"
  const m = parts.find((p) => p.type === "month")?.value ?? "01"
  const y = parts.find((p) => p.type === "year")?.value ?? "1970"
  return `${d}-${m}-${y}`
}

/**
 * Parse Promiedos `start_time` ("dd-MM-yyyy HH:mm") as ART wall time → UTC ISO.
 */
export function promiedosStartTimeToUtcIso(startTime: string): string {
  const trimmed = startTime.trim()
  const [datePart, timePart] = trimmed.split(/\s+/)
  if (!datePart || !timePart) {
    throw new Error(`Invalid Promiedos start_time: ${startTime}`)
  }
  const [dd, mm, yyyy] = datePart.split("-").map(Number)
  const [hh, min] = timePart.split(":").map(Number)
  if (
    [dd, mm, yyyy, hh, min].some(
      (n) => typeof n !== "number" || Number.isNaN(n),
    )
  ) {
    throw new Error(`Invalid Promiedos start_time: ${startTime}`)
  }
  const utcMs = Date.UTC(yyyy, mm - 1, dd, hh + ART_OFFSET_HOURS_UTC, min, 0)
  return new Date(utcMs).toISOString()
}

export function teamKeyFromPromiedosId(teamId: string): string {
  return `pm:${teamId}`
}

export function promiedosIdFromTeamKey(teamKey: string): string | null {
  if (!teamKey.startsWith("pm:")) return null
  return teamKey.slice(3)
}

export function externalMatchIdFromGameId(gameId: string): string {
  return `promiedos:${gameId}`
}

export function promiedosTeamCrestUrl(teamId: string): string {
  const base = PROMIEDOS_API_BASE.replace(/\/$/, "")
  return `${base}/images/team/${teamId}/4`
}

/**
 * Best-effort URL to the match page on promiedos.com.ar (`league`/`game` slugs
 * from the API). Returns null if slugs are missing; verify path if the site changes.
 */
export function promiedosFixtureWebUrl(
  league: PromiedosLeague,
  game: PromiedosGame,
): string | null {
  const l = league.url_name?.trim()
  const g = game.url_name?.trim()
  if (!l || !g) return null
  const base = PROMIEDOS_WEB_BASE.replace(/\/$/, "")
  return `${base}/${l}/${g}`
}

export async function fetchGamesForDate(
  date: Date,
  timeZone: string,
): Promise<PromiedosGamesResponse> {
  const segment = formatPromiedosGamesDate(date, timeZone)
  const res = await promiedosFetch(`/games/${segment}`)
  if (!res.ok) {
    throw new Error(`Promiedos /games/${segment} error: ${res.status}`)
  }
  return (await res.json()) as PromiedosGamesResponse
}

export async function fetchGamesToday(): Promise<PromiedosGamesResponse> {
  const res = await promiedosFetch("/games/today")
  if (!res.ok) {
    throw new Error(`Promiedos /games/today error: ${res.status}`)
  }
  return (await res.json()) as PromiedosGamesResponse
}

/**
 * Fetches `GET /games/{segment}` where `segment` is already `dd-MM-yyyy` for the
 * calendar day Promiedos expects (e.g. ART). Avoids timezone skew vs `Date` in UTC.
 */
export async function fetchGamesForSegment(
  segment: string,
): Promise<PromiedosGamesResponse> {
  const res = await promiedosFetch(`/games/${segment}`)
  if (!res.ok) {
    throw new Error(`Promiedos /games/${segment} error: ${res.status}`)
  }
  return (await res.json()) as PromiedosGamesResponse
}

const DEFAULT_WC_INDEX_DATES = [
  "15-06-2026",
  "16-06-2026",
  "17-06-2026",
  "18-06-2026",
  "19-06-2026",
  "20-06-2026",
  "21-06-2026",
  "22-06-2026",
  "23-06-2026",
  "24-06-2026",
  "25-06-2026",
  "26-06-2026",
]

let mundialIndexCache: {
  at: number
  teams: PromiedosSearchTeamResult[]
} | null = null

const MUNDIAL_INDEX_CACHE_MS = 60 * 60 * 1000

function isMundialLeague(league: PromiedosLeague): boolean {
  const n = (league.name ?? "").toLowerCase()
  return (
    league.url_name === "fifa-world-cup" ||
    league.id === "fjda" ||
    n.includes("mundial")
  )
}

/**
 * Collects unique teams from Promiedos Mundial fixtures on a spread of group-stage
 * dates (for linking FIFA WC squad list to `pm:` ids). Cached 1h per process.
 */
export async function fetchMundialPromiedosTeamsIndex(): Promise<
  PromiedosSearchTeamResult[]
> {
  const now = Date.now()
  if (
    mundialIndexCache &&
    now - mundialIndexCache.at < MUNDIAL_INDEX_CACHE_MS
  ) {
    return mundialIndexCache.teams
  }

  const rawDates =
    process.env.PROMIEDOS_WC_INDEX_DATES?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? DEFAULT_WC_INDEX_DATES

  const seen = new Set<string>()
  const collected: PromiedosSearchTeamResult[] = []

  const merge = (raw: PromiedosGamesResponse) => {
    for (const league of raw.leagues ?? []) {
      if (!isMundialLeague(league)) continue
      for (const game of league.games ?? []) {
        for (const t of game.teams ?? []) {
          if (!t.id || seen.has(t.id)) continue
          seen.add(t.id)
          collected.push({
            teamKey: teamKeyFromPromiedosId(t.id),
            name: t.name,
            shortName: t.short_name ?? t.name,
            tla: (t.short_name ?? t.name).slice(0, 3).toUpperCase(),
            crest: promiedosTeamCrestUrl(t.id),
            urlName: t.url_name,
          })
        }
      }
    }
  }

  await Promise.all(
    rawDates.map(async (seg) => {
      try {
        merge(await fetchGamesForSegment(seg))
      } catch {
        // skip failed day
      }
    }),
  )

  mundialIndexCache = { at: now, teams: collected }
  return collected
}

export function flattenGamesFromResponse(
  raw: PromiedosGamesResponse,
): Array<{ league: PromiedosLeague; game: PromiedosGame }> {
  const out: Array<{ league: PromiedosLeague; game: PromiedosGame }> = []
  for (const league of raw.leagues ?? []) {
    for (const game of league.games ?? []) {
      out.push({ league, game })
    }
  }
  return out
}

export function filterGamesForTeamIds(
  raw: PromiedosGamesResponse,
  teamIds: Set<string>,
): Array<{ league: PromiedosLeague; game: PromiedosGame }> {
  return flattenGamesFromResponse(raw).filter(({ game }) =>
    game.teams?.some((t) => teamIds.has(t.id)),
  )
}

function mapPromiedosStatusToMatchStatus(
  status: PromiedosGame["status"],
): string {
  const name = (status?.name ?? "").toLowerCase()
  const short = (status?.short_name ?? "").toLowerCase()
  const n = `${name} ${short}`
  if (n.includes("prog") || n.includes("programad")) return "scheduled"
  if (n.includes("final") || n.includes("fin")) return "finished"
  if (
    n.includes("vivo") ||
    n.includes("live") ||
    n.includes("jug") ||
    status.enum === 2
  )
    return "live"
  if (n.includes("postpon") || n.includes("susp")) return "postponed"
  return "scheduled"
}

export function mapPromiedosGameToMatch(
  league: PromiedosLeague,
  game: PromiedosGame,
  followedPromiedosTeamId: string,
  teamMeta: { name: string; shortName: string; crest: string },
): LiveFixture {
  const teams = game.teams ?? []
  const idx = teams.findIndex((t) => t.id === followedPromiedosTeamId)
  const ours = teams[idx]
  if (!ours) {
    throw new Error(`Team ${followedPromiedosTeamId} not in game ${game.id}`)
  }
  const isHome = idx === 0
  const opponent = isHome ? teams[1] : teams[0]
  if (!opponent) {
    throw new Error(`Invalid teams array for game ${game.id}`)
  }

  const matchDate = promiedosStartTimeToUtcIso(game.start_time)
  const status = mapPromiedosStatusToMatchStatus(game.status)

  return {
    externalMatchId: externalMatchIdFromGameId(game.id),
    teamKey: teamKeyFromPromiedosId(followedPromiedosTeamId),
    opponent: opponent.name,
    opponentLogo: promiedosTeamCrestUrl(opponent.id),
    competition: league.name,
    competitionLogo: null,
    matchDate,
    venue: null,
    isHome: isHome ? 1 : 0,
    status,
    teamName: teamMeta.name,
    teamShortName: teamMeta.shortName,
    teamCrest: teamMeta.crest,
    teamScore: null,
    opponentScore: null,
    promiedosFixtureUrl: promiedosFixtureWebUrl(league, game),
  }
}

export interface PromiedosSearchTeamResult {
  teamKey: string
  name: string
  shortName: string
  tla: string
  crest: string
  urlName: string
}

let searchCache: {
  at: number
  teams: PromiedosSearchTeamResult[]
} | null = null

const SEARCH_CACHE_MS = 60 * 60 * 1000

/** Default days before “today” to scan for team discovery (wider than legacy 3). */
const DEFAULT_SEARCH_DAYS_BACK = 7
/** Default days after “today” to scan (national teams may lack fixtures in a short window). */
const DEFAULT_SEARCH_DAYS_FORWARD = 60

function searchWindowDaysBack(): number {
  const raw = process.env.PROMIEDOS_SEARCH_DAYS_BACK
  if (raw === undefined || raw === "") return DEFAULT_SEARCH_DAYS_BACK
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SEARCH_DAYS_BACK
}

function searchWindowDaysForward(): number {
  const raw = process.env.PROMIEDOS_SEARCH_DAYS_FORWARD
  if (raw === undefined || raw === "") return DEFAULT_SEARCH_DAYS_FORWARD
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SEARCH_DAYS_FORWARD
}

function collectUniqueTeamsFromResponse(
  raw: PromiedosGamesResponse,
): PromiedosSearchTeamResult[] {
  const byId = new Map<string, PromiedosSearchTeamResult>()
  for (const { game } of flattenGamesFromResponse(raw)) {
    for (const t of game.teams ?? []) {
      if (!t.id || byId.has(t.id)) continue
      byId.set(t.id, {
        teamKey: teamKeyFromPromiedosId(t.id),
        name: t.name,
        shortName: t.short_name ?? t.name,
        tla: (t.short_name ?? t.name).slice(0, 3).toUpperCase(),
        crest: promiedosTeamCrestUrl(t.id),
        urlName: t.url_name,
      })
    }
  }
  return [...byId.values()]
}

/**
 * No public search endpoint was found on api.promiedos.com.ar (spike 2026).
 * Builds a searchable set from `/games/today` plus `/games/{dd-MM-yyyy}` for a
 * configurable day window (defaults + env `PROMIEDOS_SEARCH_DAYS_*`), cached in
 * memory for SEARCH_CACHE_MS. First load after cache expiry may perform many HTTP calls.
 */
export async function searchPromiedosTeams(
  query: string,
  options?: {
    timeZone?: string
    windowDaysBack?: number
    windowDaysForward?: number
  },
): Promise<PromiedosSearchTeamResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 3) return []

  const tz =
    options?.timeZone ?? PROMIEDOS_WALL_CLOCK_TIMEZONE
  const back = options?.windowDaysBack ?? searchWindowDaysBack()
  const forward = options?.windowDaysForward ?? searchWindowDaysForward()

  const now = Date.now()
  if (searchCache && now - searchCache.at < SEARCH_CACHE_MS) {
    return filterTeamResults(searchCache.teams, q)
  }

  const collected: PromiedosSearchTeamResult[] = []
  const seen = new Set<string>()

  const merge = (raw: PromiedosGamesResponse) => {
    for (const t of collectUniqueTeamsFromResponse(raw)) {
      if (seen.has(t.teamKey)) continue
      seen.add(t.teamKey)
      collected.push(t)
    }
  }

  try {
    merge(await fetchGamesToday())
  } catch {
    // non-fatal
  }

  const base = new Date()
  for (let i = -back; i <= forward; i++) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + i)
    try {
      merge(await fetchGamesForDate(d, tz))
    } catch {
      // skip day errors (rate limit, etc.)
    }
  }

  searchCache = { at: now, teams: collected }
  return filterTeamResults(collected, q)
}

export function filterTeamResults(
  teams: PromiedosSearchTeamResult[],
  q: string,
): PromiedosSearchTeamResult[] {
  return teams
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.tla.toLowerCase() === q,
    )
    .slice(0, 20)
}
