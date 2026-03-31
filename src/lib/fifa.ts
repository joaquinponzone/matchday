import type { WCMatch, GroupStanding, GroupTeam } from "@/app/(app)/world-cup/types"

const FIFA_BASE = "https://api.fifa.com/api/v3"
const COMPETITION_ID = "17"
const SEASON_ID = "285023"
const STAGE_ID = "289273"

interface LocalizedString {
  Locale: string
  Description: string
}

interface FIFATeam {
  Name?: LocalizedString[]
  ShortClubName: string
  Abbreviation: string
  PictureUrl: string | null
  IdConfederation: string | null
}

interface FIFAStandingEntry {
  IdGroup: string
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
  MatchStatus: number  // 0=upcoming, 1=live, 3=finished
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
  "USA": "EE.UU.",
  "Mexico": "México",
  "Canada": "Canadá",
  "Brazil": "Brasil",
  "Peru": "Perú",
  "Haiti": "Haití",
  "Panama": "Panamá",
  "Trinidad and Tobago": "Trinidad y Tobago",
  "Dominican Republic": "República Dominicana",
  "Bolivia": "Bolivia",
  // Europe
  "England": "Inglaterra",
  "Scotland": "Escocia",
  "Wales": "Gales",
  "Northern Ireland": "Irlanda del Norte",
  "Ireland": "Irlanda",
  "Germany": "Alemania",
  "Netherlands": "Países Bajos",
  "Switzerland": "Suiza",
  "Belgium": "Bélgica",
  "Denmark": "Dinamarca",
  "Sweden": "Suecia",
  "Norway": "Noruega",
  "Finland": "Finlandia",
  "Iceland": "Islandia",
  "Poland": "Polonia",
  "Hungary": "Hungría",
  "Turkey": "Turquía",
  "Greece": "Grecia",
  "Romania": "Rumania",
  "Czech Republic": "República Checa",
  "Czechia": "República Checa",
  "Slovakia": "Eslovaquia",
  "Slovenia": "Eslovenia",
  "Croatia": "Croacia",
  "Serbia": "Serbia",
  "Ukraine": "Ucrania",
  "North Macedonia": "Macedonia del Norte",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Albania": "Albania",
  "Austria": "Austria",
  "Russia": "Rusia",
  // Africa
  "Morocco": "Marruecos",
  "South Africa": "Sudáfrica",
  "Ivory Coast": "Costa de Marfil",
  "Cameroon": "Camerún",
  "Tunisia": "Túnez",
  "Algeria": "Argelia",
  "Cape Verde": "Cabo Verde",
  "DR Congo": "Rep. Dem. del Congo",
  "Egypt": "Egipto",
  // Asia
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "North Korea": "Corea del Norte",
  "Japan": "Japón",
  "Saudi Arabia": "Arabia Saudita",
  "Iran": "Irán",
  "IR Iran": "Irán",
  "France": "Francia",
  "Spain": "España",
  "Jordan": "Jordania",
  "Qatar": "Catar",
  "Indonesia": "Indonesia",
  "China PR": "China",
  // Oceania
  "New Zealand": "Nueva Zelanda",
  "Australia": "Australia",
}

function translateTeamName(name: string): string {
  return TEAM_NAME_ES[name] ?? name
}

function getFlagUrl(pictureUrl: string | null): string | undefined {
  if (!pictureUrl) return undefined
  return pictureUrl.replace("{format}", "sq").replace("{size}", "3")
}

export async function fetchWCStandings(): Promise<GroupStanding[]> {
  try {
    const res = await fetch(
      `${FIFA_BASE}/calendar/${COMPETITION_ID}/${SEASON_ID}/${STAGE_ID}/Standing?language=es`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []

    const data: FIFAStandingsResponse = await res.json()

    const grouped = new Map<string, { groupName: string; entries: Array<{ team: GroupTeam; position: number }> }>()

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
            : translateTeamName(entry.Team.ShortClubName || entry.Team.Abbreviation),
          played: entry.Played,
          won: entry.Won,
          drawn: entry.Drawn,
          lost: entry.Lost,
          goalsFor: entry.For,
          goalsAgainst: entry.Against,
          goalDifference: entry.GoalsDiference,
          points: entry.Points,
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

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
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

export async function fetchFinishedWCMatchScores(): Promise<
  { matchNumber: number; homeScore: number; awayScore: number }[]
> {
  try {
    const allMatches = await fetchRawWCMatches()
    return allMatches
      .filter(
        (m) =>
          m.MatchStatus === 3 &&
          m.HomeTeamScore !== null &&
          m.AwayTeamScore !== null,
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
