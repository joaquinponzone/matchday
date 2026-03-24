import type { InsertMatch } from "@/server/db/schema"

const BASE_URL = "https://api.football-data.org/v4"

export type TeamKey = "chelsea" | "argentina"

const TEAM_IDS: Record<TeamKey, number> = {
  chelsea: 61,
  argentina: 762,
}

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

export async function fetchUpcomingFixtures(teamKey: TeamKey, limit = 15): Promise<FDMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY not set")

  const id = TEAM_IDS[teamKey]
  const url = `${BASE_URL}/teams/${id}/matches?status=SCHEDULED&limit=${limit}`
  const res = await fetch(url, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)

  const data: FDResponse = await res.json()
  return data.matches
}

export function mapFixtureToMatch(match: FDMatch, teamKey: TeamKey): InsertMatch {
  const teamId = TEAM_IDS[teamKey]
  const isHome = match.homeTeam.id === teamId
  const opponent = isHome ? match.awayTeam : match.homeTeam
  const teamGoals = isHome ? match.score.fullTime.home : match.score.fullTime.away
  const opponentGoals = isHome ? match.score.fullTime.away : match.score.fullTime.home

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
    teamKey,
    opponent: opponent.name,
    opponentLogo: opponent.crest,
    competition: match.competition.name,
    competitionLogo: match.competition.emblem,
    matchDate: match.utcDate,
    venue: null,
    isHome: isHome ? 1 : 0,
    status: statusMap[match.status] ?? "scheduled",
    chelseaScore: teamGoals ?? null,
    opponentScore: opponentGoals ?? null,
  }
}
