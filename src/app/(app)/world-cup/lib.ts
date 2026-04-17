import { APP_TIMEZONE } from "@/lib/utils"
import type { WCMatch, GroupStanding, GroupTeam, BracketMatch, BracketRound } from "./types"

// Parses "13:00 UTC-6" → UTC ISO string for the given date
export function toUtcIso(date: string, time: string): string {
  const m = time.match(/(\d+):(\d+)\s+UTC([+-]\d+)/)
  if (!m) return `${date}T00:00:00Z`
  const utcHours = parseInt(m[1]) - parseInt(m[3])
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCHours(utcHours, parseInt(m[2]), 0, 0)
  return d.toISOString()
}

export function formatMatchDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(new Date(isoDate))
}

export function extractGroupStandings(matches: WCMatch[]): GroupStanding[] {
  const groupMatches = matches.filter((m) => m.group)

  const groupsMap: Record<string, Set<string>> = {}
  for (const m of groupMatches) {
    const g = m.group!
    if (!groupsMap[g]) groupsMap[g] = new Set()
    groupsMap[g].add(m.team1)
    groupsMap[g].add(m.team2)
  }

  const standings: GroupStanding[] = Object.keys(groupsMap)
    .sort()
    .map((group) => {
      const teams: GroupTeam[] = Array.from(groupsMap[group])
        .sort()
        .map((name) => ({
          name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        }))
      return { group, teams }
    })

  return standings
}

// Translates bracket placeholder codes to readable labels
export function resolveTeamLabel(code: string): string {
  // "1A" → "1° Grupo A"
  const posGroup = code.match(/^([123])([A-L])$/)
  if (posGroup) {
    const pos = posGroup[1]
    const g = posGroup[2]
    const label = pos === "1" ? "1°" : pos === "2" ? "2°" : "3°"
    return `${label} Gr. ${g}`
  }

  // "3A/B/C/D/F" → "3° (A/B/C/D/F)"
  const bestThird = code.match(/^3([A-L](?:\/[A-L])+)$/)
  if (bestThird) return `3° (${bestThird[1]})`

  // "W74" → "G. P74"
  const winner = code.match(/^W(\d+)$/)
  if (winner) return `G. P${winner[1]}`

  // "L101" → "P. P101"
  const loser = code.match(/^L(\d+)$/)
  if (loser) return `P. P${loser[1]}`

  return code
}

// Bracket connections: which match feeds into which
// key = match num, value = next match num
const FEEDS_INTO: Record<number, number> = {
  // Left R32 → R16
  74: 89, 77: 89,
  73: 90, 75: 90,
  // Left R16 → QF
  89: 97, 90: 97,
  // Left QF → SF
  97: 101,
  // Right R32 → R16
  76: 91, 78: 91,
  79: 92, 80: 92,
  // Right R16 → QF
  91: 99, 92: 99,
  // Right QF → SF
  99: 102,
  // Bottom R32 → R16
  83: 93, 84: 93,
  81: 94, 82: 94,
  // Bottom R16 → QF
  93: 98, 94: 98,
  // Bottom QF → SF
  98: 101,
  // Bottom-right R32 → R16
  86: 95, 88: 95,
  85: 96, 87: 96,
  // Bottom-right R16 → QF
  95: 100, 96: 100,
  // Bottom-right QF → SF
  100: 102,
  // SF → Final
  101: 104, 102: 104,
}

export function getFeedsInto(num: number): number | undefined {
  return FEEDS_INTO[num]
}

// Left side bracket order (top to bottom within each round)
const LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82]
const LEFT_R16 = [89, 90, 93, 94]
const LEFT_QF = [97, 98]
const LEFT_SF = [101]

// Right side bracket order (top to bottom)
const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87]
const RIGHT_R16 = [91, 92, 95, 96]
const RIGHT_QF = [99, 100]
const RIGHT_SF = [102]

export function buildBracketRounds(matches: WCMatch[]): BracketRound[] {
  const knockoutMatches = matches.filter((m) => !m.group && m.num !== undefined)
  const byNum: Record<number, BracketMatch> = {}
  for (const m of knockoutMatches) {
    byNum[m.num!] = {
      num: m.num!,
      round: m.round,
      date: m.date,
      time: m.time,
      team1: m.team1,
      team2: m.team2,
      ground: m.ground,
    }
  }

  // Special matches without num
  const finalMatch = matches.find((m) => m.round === "Final")
  const thirdMatch = matches.find((m) => m.round === "Match for third place")

  const pick = (nums: number[]) => nums.map((n) => byNum[n]).filter(Boolean)

  const rounds: BracketRound[] = [
    { name: "Dieciseisavos", side: "left", matches: pick(LEFT_R32) },
    { name: "Octavos", side: "left", matches: pick(LEFT_R16) },
    { name: "Cuartos", side: "left", matches: pick(LEFT_QF) },
    { name: "Semifinal", side: "left", matches: pick(LEFT_SF) },
    {
      name: "Final",
      side: "center",
      matches: [
        ...(finalMatch
          ? [
              {
                num: 104,
                round: "Final",
                date: finalMatch.date,
                time: finalMatch.time,
                team1: finalMatch.team1,
                team2: finalMatch.team2,
                ground: finalMatch.ground,
              },
            ]
          : []),
        ...(thirdMatch
          ? [
              {
                num: 103,
                round: "Match for third place",
                date: thirdMatch.date,
                time: thirdMatch.time,
                team1: thirdMatch.team1,
                team2: thirdMatch.team2,
                ground: thirdMatch.ground,
              },
            ]
          : []),
      ],
    },
    { name: "Semifinal", side: "right", matches: pick(RIGHT_SF) },
    { name: "Cuartos", side: "right", matches: pick(RIGHT_QF) },
    { name: "Octavos", side: "right", matches: pick(RIGHT_R16) },
    { name: "Dieciseisavos", side: "right", matches: pick(RIGHT_R32) },
  ]

  return rounds
}
