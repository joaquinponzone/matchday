import type { InsertMatch } from "@/server/db/schema"

const BASE_URL = "https://api.football-data.org/v4"

interface FDMatch {
  id: number
  utcDate: string
  status: string
  competition: { name: string; emblem: string }
  homeTeam: { id: number; name: string; crest: string }
  awayTeam: { id: number; name: string; crest: string }
  score: { fullTime: { home: number | null; away: number | null } }
}

interface FDResponse {
  matches: FDMatch[]
}

interface TeamMeta {
  name: string
  shortName: string
  crest: string
}

interface FDTeam {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

interface FDTeamsResponse {
  teams: FDTeam[]
}

function getApiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY not set")
  return key
}

export async function fetchUpcomingFixtures(
  teamApiId: number,
  limit = 15,
): Promise<FDMatch[]> {
  const key = getApiKey()
  const url = `${BASE_URL}/teams/${teamApiId}/matches?status=SCHEDULED&limit=${limit}`
  const res = await fetch(url, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)

  const data: FDResponse = await res.json()
  return data.matches
}

export function mapFixtureToMatch(
  match: FDMatch,
  teamApiId: number,
  teamMeta: TeamMeta,
): InsertMatch {
  const isHome = match.homeTeam.id === teamApiId
  const opponent = isHome ? match.awayTeam : match.homeTeam
  const teamGoals = isHome
    ? match.score.fullTime.home
    : match.score.fullTime.away
  const opponentGoals = isHome
    ? match.score.fullTime.away
    : match.score.fullTime.home

  const statusMap: Record<string, string> = {
    SCHEDULED: "scheduled",
    TIMED: "scheduled",
    IN_PLAY: "live",
    PAUSED: "live",
    LIVE: "live",
    FINISHED: "finished",
    POSTPONED: "postponed",
    CANCELLED: "postponed",
    ABANDONED: "postponed",
  }

  return {
    apiFootballId: match.id,
    teamKey: String(teamApiId),
    opponent: opponent.name,
    opponentLogo: opponent.crest,
    competition: match.competition.name,
    competitionLogo: match.competition.emblem,
    matchDate: match.utcDate,
    venue: null,
    isHome: isHome ? 1 : 0,
    status: statusMap[match.status] ?? "scheduled",
    teamName: teamMeta.name,
    teamShortName: teamMeta.shortName,
    teamCrest: teamMeta.crest,
    teamScore: teamGoals ?? null,
    opponentScore: opponentGoals ?? null,
  }
}

interface FDTeamsPageResponse {
  count: number
  teams: FDTeam[]
}

let cachedTeams: FDTeam[] | null = null

async function getAllTeams(): Promise<FDTeam[]> {
  if (cachedTeams) return cachedTeams

  const key = getApiKey()
  const allTeams: FDTeam[] = []
  const limit = 500
  let offset = 0

  while (true) {
    const res = await fetch(
      `${BASE_URL}/teams?limit=${limit}&offset=${offset}`,
      {
        headers: { "X-Auth-Token": key },
        next: { revalidate: 0 },
      },
    )
    if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)

    const data: FDTeamsPageResponse = await res.json()
    allTeams.push(...data.teams)

    if (allTeams.length >= data.count) break
    offset += limit
  }

  cachedTeams = allTeams
  return allTeams
}

export interface FDWorldCupMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
  }
}

interface FDMatchesResponse {
  matches: FDWorldCupMatch[]
}

export async function fetchWorldCupMatches(): Promise<FDWorldCupMatch[]> {
  const key = getApiKey()
  const res = await fetch(`${BASE_URL}/matches?competitions=2000`, {
    headers: { "X-Auth-Token": key },
    // next: { revalidate: 3600 },
    next: { revalidate: 0 },
  })

  if (!res.ok) return []

  const data: FDMatchesResponse = await res.json()
  console.log("data", data)
  return data.matches.filter((m) => m.stage === "GROUP_STAGE")
}

export async function searchTeams(
  query: string,
): Promise<Array<{ id: number; name: string; shortName: string; tla: string; crest: string }>> {
  const teams = await getAllTeams()
  const q = query.toLowerCase()

  return teams
    .filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.shortName?.toLowerCase().includes(q) ||
        t.tla?.toLowerCase() === q,
    )
    .slice(0, 20)
    .map((t) => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      tla: t.tla,
      crest: t.crest,
    }))
}
