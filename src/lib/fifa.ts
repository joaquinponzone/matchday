import { unstable_cache } from "next/cache"
import type {
  WCMatch,
  GroupStanding,
  GroupTeam,
  PlayerStatRow,
  PlayerLeaderboards,
} from "@/app/(app)/world-cup/types"

const FIFA_BASE = "https://api.fifa.com/api/v3"
// FIFA Data Hub: misma fuente que usa la web de fifa.com para stats de jugador.
const FDH_BASE = "https://fdh-api.fifa.com/v1"
const COMPETITION_ID = "17"
const SEASON_ID = "285023"
const STAGE_ID = "289273"

interface LocalizedString {
  Locale: string
  Description: string
}

interface FIFATeam {
  IdTeam?: string
  Name?: LocalizedString[]
  ShortClubName: string
  Abbreviation: string
  PictureUrl: string | null
  IdConfederation: string | null
}

interface FIFAStandingEntry {
  IdGroup: string
  /** Sometimes present on the row as well as on `Team` */
  IdTeam?: string
  Group: LocalizedString[]
  Position: number
  Played: number
  Won: number
  Lost: number
  Drawn: number
  For: number
  Against: number
  GoalsDiference: number
  Points: number
  TeamConductScore?: number
  Team: FIFATeam
}

interface FIFAStandingsResponse {
  Results: FIFAStandingEntry[]
}

interface FIFAMatchTeam {
  TeamName?: LocalizedString[]
  ShortClubName: string
  Abbreviation: string
  PictureUrl: string | null
}

interface FIFAStadium {
  Name: LocalizedString[]
  CityName: LocalizedString[]
}

interface FIFAMatch {
  IdGroup: string | null
  GroupName: LocalizedString[]
  StageName: LocalizedString[]
  MatchNumber: number
  Date: string
  TimeDefined: boolean
  MatchStatus: number // 0=finished, 1=upcoming, 3=live
  MatchTime: string | null // minuto en vivo, ej "90'+4'"
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  Home: FIFAMatchTeam | null
  Away: FIFAMatchTeam | null
  Stadium: FIFAStadium | null
  PlaceHolderA: string | null
  PlaceHolderB: string | null
}

interface FIFAMatchesResponse {
  ContinuationToken: string | null
  Results: FIFAMatch[]
}

function getLocale(arr: LocalizedString[]): string {
  return (
    arr.find((x) => x.Locale === "es-ES")?.Description ??
    arr.find((x) => x.Locale === "en-GB")?.Description ??
    arr[0]?.Description ??
    ""
  )
}

const TEAM_NAME_ES: Record<string, string> = {
  // Americas
  "United States": "Estados Unidos",
  USA: "EE.UU.",
  Mexico: "México",
  Canada: "Canadá",
  Brazil: "Brasil",
  Peru: "Perú",
  Haiti: "Haití",
  Panama: "Panamá",
  "Trinidad and Tobago": "Trinidad y Tobago",
  "Dominican Republic": "República Dominicana",
  Bolivia: "Bolivia",
  // Europe
  England: "Inglaterra",
  Scotland: "Escocia",
  Wales: "Gales",
  "Northern Ireland": "Irlanda del Norte",
  Ireland: "Irlanda",
  Germany: "Alemania",
  Netherlands: "Países Bajos",
  Switzerland: "Suiza",
  Belgium: "Bélgica",
  Denmark: "Dinamarca",
  Sweden: "Suecia",
  Norway: "Noruega",
  Finland: "Finlandia",
  Iceland: "Islandia",
  Poland: "Polonia",
  Hungary: "Hungría",
  Turkey: "Turquía",
  Greece: "Grecia",
  Romania: "Rumania",
  "Czech Republic": "República Checa",
  Czechia: "República Checa",
  Slovakia: "Eslovaquia",
  Slovenia: "Eslovenia",
  Croatia: "Croacia",
  Serbia: "Serbia",
  Ukraine: "Ucrania",
  "North Macedonia": "Macedonia del Norte",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Albania: "Albania",
  Austria: "Austria",
  Russia: "Rusia",
  // Africa
  Morocco: "Marruecos",
  "South Africa": "Sudáfrica",
  "Ivory Coast": "Costa de Marfil",
  Cameroon: "Camerún",
  Tunisia: "Túnez",
  Algeria: "Argelia",
  "Cape Verde": "Cabo Verde",
  "DR Congo": "Rep. Dem. del Congo",
  Egypt: "Egipto",
  // Asia
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "North Korea": "Corea del Norte",
  Japan: "Japón",
  "Saudi Arabia": "Arabia Saudita",
  Iran: "Irán",
  "IR Iran": "Irán",
  France: "Francia",
  Spain: "España",
  Jordan: "Jordania",
  Qatar: "Catar",
  Indonesia: "Indonesia",
  "China PR": "China",
  // Oceania
  "New Zealand": "Nueva Zelanda",
  Australia: "Australia",
}

function translateTeamName(name: string): string {
  return TEAM_NAME_ES[name] ?? name
}

function getFlagUrl(pictureUrl: string | null): string | undefined {
  if (!pictureUrl) return undefined
  return pictureUrl.replace("{format}", "sq").replace("{size}", "3")
}

/** Lowercase, strip diacritics and collapse whitespace for team-name matching. */
function normalizeTeamKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

/**
 * Promiedos (es) team names that differ from FIFA's (es) names, mapped to the
 * FIFA abbreviation so we can resolve the right flag. Keyed by normalized name.
 */
const PROMIEDOS_TO_FIFA_ABBR: Record<string, string> = {
  "cabo verde": "CPV",
  iran: "IRN",
  "arabia saudita": "KSA",
  "corea del sur": "KOR",
  "republica checa": "CZE",
  qatar: "QAT",
  "bosnia herzegovina": "BIH",
  "estados unidos": "USA",
}

export interface WcFlagLookup {
  /** Resolves a national-team flag URL by name, or `undefined` for non-countries. */
  resolve: (name: string | null | undefined) => string | undefined
}

/**
 * Builds a lookup that maps a (Spanish) national-team name to its FIFA flag URL,
 * using the WC squad list. Names that don't match a WC nation resolve to
 * `undefined` (e.g. clubs), so callers can keep their original crest.
 */
export async function buildWcFlagLookup(): Promise<WcFlagLookup> {
  const teams = await fetchFifaWCNationalTeamsForSearch()

  const byName = new Map<string, string>()
  const byAbbr = new Map<string, string>()
  for (const t of teams) {
    if (!t.flagUrl) continue
    byName.set(normalizeTeamKey(t.nameEs), t.flagUrl)
    if (t.abbreviation) byAbbr.set(t.abbreviation.toUpperCase(), t.flagUrl)
  }

  const resolve = (name: string | null | undefined): string | undefined => {
    if (!name) return undefined
    const key = normalizeTeamKey(name)

    const aliasAbbr = PROMIEDOS_TO_FIFA_ABBR[key]
    if (aliasAbbr) {
      const flag = byAbbr.get(aliasAbbr)
      if (flag) return flag
    }

    const exact = byName.get(key)
    if (exact) return exact

    for (const [fifaName, flag] of byName) {
      if (fifaName.includes(key) || key.includes(fifaName)) return flag
    }

    return undefined
  }

  return { resolve }
}

export interface FifaWcNationalTeamForSearch {
  idTeam: string
  nameEs: string
  abbreviation: string
  /** Resolved FIFA flag URL (`{format}`/`{size}` replaced), or null */
  flagUrl: string | null
}

/**
 * All national teams from the WC Standing feed (Spanish names), deduped by `IdTeam`.
 * Used to search selecciones while linking to Promiedos `pm:` ids for fixtures.
 */
export async function fetchFifaWCNationalTeamsForSearch(): Promise<
  FifaWcNationalTeamForSearch[]
> {
  try {
    const res = await fetch(
      `${FIFA_BASE}/calendar/${COMPETITION_ID}/${SEASON_ID}/${STAGE_ID}/Standing?language=es`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []

    const data: FIFAStandingsResponse = await res.json()
    const byId = new Map<string, FifaWcNationalTeamForSearch>()

    for (const entry of data.Results ?? []) {
      const team = entry.Team
      const idTeam =
        team.IdTeam?.trim() ||
        entry.IdTeam?.trim() ||
        `${team.Abbreviation}-${team.ShortClubName}`.replace(/\s+/g, "")
      if (!idTeam) continue

      const nameEs = team.Name?.length
        ? getLocale(team.Name)
        : translateTeamName(team.ShortClubName || team.Abbreviation)

      const flagUrl = getFlagUrl(team.PictureUrl) ?? null

      if (!byId.has(idTeam)) {
        byId.set(idTeam, {
          idTeam,
          nameEs,
          abbreviation: team.Abbreviation,
          flagUrl,
        })
      }
    }

    return [...byId.values()]
  } catch {
    return []
  }
}

export async function fetchWCStandings(): Promise<GroupStanding[]> {
  try {
    const res = await fetch(
      `${FIFA_BASE}/calendar/${COMPETITION_ID}/${SEASON_ID}/${STAGE_ID}/Standing?language=es`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []

    const data: FIFAStandingsResponse = await res.json()

    const grouped = new Map<
      string,
      {
        groupName: string
        entries: Array<{ team: GroupTeam; position: number }>
      }
    >()

    for (const entry of data.Results) {
      const groupName = getLocale(entry.Group)
      if (!grouped.has(entry.IdGroup)) {
        grouped.set(entry.IdGroup, { groupName, entries: [] })
      }
      grouped.get(entry.IdGroup)!.entries.push({
        position: entry.Position,
        team: {
          name: entry.Team.Name?.length
            ? getLocale(entry.Team.Name)
            : translateTeamName(
                entry.Team.ShortClubName || entry.Team.Abbreviation
              ),
          played: entry.Played,
          won: entry.Won,
          drawn: entry.Drawn,
          lost: entry.Lost,
          goalsFor: entry.For,
          goalsAgainst: entry.Against,
          goalDifference: entry.GoalsDiference,
          points: entry.Points,
          conductScore: entry.TeamConductScore,
          flagUrl: getFlagUrl(entry.Team.PictureUrl),
        },
      })
    }

    return Array.from(grouped.values())
      .map(({ groupName, entries }) => ({
        group: groupName,
        teams: entries
          .sort((a, b) => a.position - b.position)
          .map((e) => e.team),
      }))
      .sort((a, b) => a.group.localeCompare(b.group))
  } catch {
    return []
  }
}

async function fetchRawWCMatches(opts?: {
  fresh?: boolean
}): Promise<FIFAMatch[]> {
  const allMatches: FIFAMatch[] = []
  let token: string | null = null

  // 60s en modo normal para que minuto y marcador en vivo se mantengan frescos.
  const fetchInit: RequestInit & { next?: { revalidate: number } } = opts?.fresh
    ? { cache: "no-store" }
    : { next: { revalidate: 60 } }

  do {
    const url = new URL(`${FIFA_BASE}/calendar/matches`)
    url.searchParams.set("idCompetition", COMPETITION_ID)
    url.searchParams.set("idSeason", SEASON_ID)
    url.searchParams.set("count", "200")
    url.searchParams.set("language", "es")
    if (token) url.searchParams.set("continuationToken", token)

    const res = await fetch(url.toString(), fetchInit)
    if (!res.ok) break

    const data: FIFAMatchesResponse = await res.json()
    allMatches.push(...data.Results)
    token = data.ContinuationToken
  } while (token)

  return allMatches
}

function mapFIFAMatch(m: FIFAMatch): WCMatch {
  const d = new Date(m.Date)
  const date = d.toISOString().slice(0, 10)
  const hours = d.getUTCHours().toString().padStart(2, "0")
  const mins = d.getUTCMinutes().toString().padStart(2, "0")
  const time = `${hours}:${mins} UTC+0`

  const team1 = m.Home?.TeamName?.length
    ? getLocale(m.Home.TeamName)
    : translateTeamName(m.Home?.ShortClubName ?? m.PlaceHolderA ?? "TBD")
  const team2 = m.Away?.TeamName?.length
    ? getLocale(m.Away.TeamName)
    : translateTeamName(m.Away?.ShortClubName ?? m.PlaceHolderB ?? "TBD")
  const team1FlagUrl = getFlagUrl(m.Home?.PictureUrl ?? null)
  const team2FlagUrl = getFlagUrl(m.Away?.PictureUrl ?? null)

  const city = m.Stadium ? getLocale(m.Stadium.CityName) : ""
  const stadium = m.Stadium ? getLocale(m.Stadium.Name) : ""
  const ground = city || stadium || ""

  const isGroup = m.IdGroup !== null
  const round = isGroup
    ? getLocale(m.GroupName) || "Fase de Grupos"
    : getLocale(m.StageName) || "Fase Eliminatoria"

  return {
    round,
    num: m.MatchNumber,
    date,
    time,
    team1,
    team2,
    team1FlagUrl,
    team2FlagUrl,
    group: isGroup ? getLocale(m.GroupName) : undefined,
    ground,
    homeScore: m.HomeTeamScore,
    awayScore: m.AwayTeamScore,
    finished: m.MatchStatus === 0,
    matchTime: m.MatchStatus === 3 ? m.MatchTime : null,
  }
}

export async function fetchWCGroupMatches(): Promise<WCMatch[]> {
  try {
    const allMatches = await fetchRawWCMatches()
    return allMatches.filter((m) => m.IdGroup !== null).map(mapFIFAMatch)
  } catch {
    return []
  }
}

export async function fetchAllWCMatches(): Promise<WCMatch[]> {
  try {
    const allMatches = await fetchRawWCMatches()
    return allMatches.map(mapFIFAMatch).sort((a, b) => {
      const da = new Date(`${a.date}T${a.time.split(" ")[0]}Z`)
      const db2 = new Date(`${b.date}T${b.time.split(" ")[0]}Z`)
      return da.getTime() - db2.getTime()
    })
  } catch {
    return []
  }
}

export async function fetchFinishedWCMatchScores(opts?: {
  fresh?: boolean
}): Promise<{ matchNumber: number; homeScore: number; awayScore: number }[]> {
  try {
    const allMatches = await fetchRawWCMatches(opts)
    return allMatches
      .filter(
        (m) =>
          m.MatchStatus === 0 &&
          m.HomeTeamScore !== null &&
          m.AwayTeamScore !== null
      )
      .map((m) => ({
        matchNumber: m.MatchNumber,
        homeScore: m.HomeTeamScore!,
        awayScore: m.AwayTeamScore!,
      }))
  } catch {
    return []
  }
}

// --- Estadísticas de jugador (FIFA Data Hub) ---

/** Stats agregadas de un jugador en la temporada (lo que nos interesa rankear). */
interface PlayerSeasonStat {
  idPlayer: string
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  timePlayed: number
  passes: number
  shots: number
  distance: number
  saves: number
}

/** El feed es `{ [idPlayer]: [ [metric, value, bool], ... ] }`. */
type FdhPlayersResponse = Record<string, [string, number, boolean][]>

/**
 * Stats por jugador de toda la temporada desde el FIFA Data Hub.
 * El payload es ~6.8MB → excede el límite de 2MB del Data Cache de Next, por eso
 * `no-store` (no se puede cachear la respuesta cruda). El resultado *reducido* se
 * cachea aguas arriba con `unstable_cache` en `fetchWCPlayerLeaderboards`.
 */
async function fetchWCPlayerSeasonStats(): Promise<PlayerSeasonStat[]> {
  try {
    const res = await fetch(
      `${FDH_BASE}/stats/season/${SEASON_ID}/players.json`,
      {
        cache: "no-store",
      }
    )
    if (!res.ok) return []

    const data: FdhPlayersResponse = await res.json()

    return Object.entries(data).map(([idPlayer, metrics]) => {
      const get = (name: string): number => {
        const m = metrics.find((x) => x[0] === name)
        return typeof m?.[1] === "number" ? m[1] : 0
      }
      return {
        idPlayer,
        goals: get("Goals"),
        assists: get("Assists"),
        yellowCards: get("YellowCards"),
        redCards: get("RedCards"),
        timePlayed: get("TimePlayed"),
        passes: get("Passes"),
        shots: get("AttemptAtGoal"),
        distance: get("TotalDistance"),
        saves: get("GoalkeeperSaves"),
      }
    })
  } catch {
    return []
  }
}

/** Resuelve nombre + país (abreviatura FIFA) de un conjunto de jugadores. */
async function fetchWCPlayersMeta(
  ids: string[]
): Promise<Map<string, { name: string; country: string }>> {
  const meta = new Map<string, { name: string; country: string }>()

  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${FIFA_BASE}/players/${id}?language=es`, {
          next: { revalidate: 3600 },
        })
        if (!res.ok) return
        const data: { Name?: LocalizedString[]; IdCountry?: string } =
          await res.json()
        const name = data.Name?.length ? getLocale(data.Name) : id
        meta.set(id, { name, country: (data.IdCountry ?? "").toUpperCase() })
      } catch {
        // Ignoramos fallos individuales de metadata.
      }
    })
  )

  return meta
}

const PLAYER_TOP_N = 10

/**
 * Arma los rankings de jugadores (goleadores, asistencias, tarjetas, minutos)
 * con nombre y bandera resueltos. Solo pide metadata de los jugadores que
 * aparecen en algún top, para minimizar requests.
 */
async function buildWCPlayerLeaderboards(): Promise<PlayerLeaderboards> {
  const stats = await fetchWCPlayerSeasonStats()
  if (stats.length === 0) {
    return {
      topScorers: [],
      topAssists: [],
      topYellowCards: [],
      topRedCards: [],
      topMinutes: [],
      topPasses: [],
      topShots: [],
      topDistance: [],
      topSaves: [],
    }
  }

  const top = (
    pick: (s: PlayerSeasonStat) => number,
    tiebreak?: (s: PlayerSeasonStat) => number
  ): PlayerSeasonStat[] =>
    [...stats]
      .filter((s) => pick(s) > 0)
      .sort((a, b) => {
        const d = pick(b) - pick(a)
        if (d !== 0) return d
        return tiebreak ? tiebreak(b) - tiebreak(a) : 0
      })
      .slice(0, PLAYER_TOP_N)

  const scorers = top(
    (s) => s.goals,
    (s) => s.assists
  )
  const assists = top((s) => s.assists)
  const yellow = top((s) => s.yellowCards)
  const red = top((s) => s.redCards)
  const minutes = top((s) => s.timePlayed)
  const passes = top((s) => s.passes)
  const shots = top((s) => s.shots)
  const distance = top((s) => s.distance)
  const saves = top((s) => s.saves)

  const ids = [
    ...new Set(
      [
        ...scorers,
        ...assists,
        ...yellow,
        ...red,
        ...minutes,
        ...passes,
        ...shots,
        ...distance,
        ...saves,
      ].map((s) => s.idPlayer)
    ),
  ]

  const [meta, teams] = await Promise.all([
    fetchWCPlayersMeta(ids),
    fetchFifaWCNationalTeamsForSearch(),
  ])

  const flagByAbbr = new Map<string, string>()
  for (const t of teams) {
    if (t.flagUrl) flagByAbbr.set(t.abbreviation.toUpperCase(), t.flagUrl)
  }

  const toRow = (
    s: PlayerSeasonStat,
    value: number,
    withAssists = false
  ): PlayerStatRow => {
    const m = meta.get(s.idPlayer)
    const country = m?.country ?? ""
    return {
      idPlayer: s.idPlayer,
      name: m?.name ?? s.idPlayer,
      country,
      flagUrl: flagByAbbr.get(country),
      value,
      ...(withAssists ? { assists: s.assists } : {}),
    }
  }

  return {
    topScorers: scorers.map((s) => toRow(s, s.goals, true)),
    topAssists: assists.map((s) => toRow(s, s.assists)),
    topYellowCards: yellow.map((s) => toRow(s, s.yellowCards)),
    topRedCards: red.map((s) => toRow(s, s.redCards)),
    topMinutes: minutes.map((s) => toRow(s, Math.round(s.timePlayed))),
    topPasses: passes.map((s) => toRow(s, s.passes)),
    topShots: shots.map((s) => toRow(s, s.shots)),
    topDistance: distance.map((s) =>
      toRow(s, Math.round(s.distance / 100) / 10)
    ),
    topSaves: saves.map((s) => toRow(s, s.saves)),
  }
}

/**
 * Versión cacheada: el feed crudo (~6.8MB) no entra en el Data Cache (límite 2MB),
 * así que cacheamos el resultado ya reducido (objeto chico) con `unstable_cache`.
 * El miss (~1 vez/hora) hace la descarga pesada + metadata; los demás requests lo
 * sirven del cache.
 */
export const fetchWCPlayerLeaderboards = unstable_cache(
  buildWCPlayerLeaderboards,
  ["wc-player-leaderboards"],
  { revalidate: 3600 }
)
