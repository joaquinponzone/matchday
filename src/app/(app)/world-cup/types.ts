export interface WCMatch {
  round: string
  num?: number
  date: string
  time: string
  team1: string
  team2: string
  team1FlagUrl?: string
  team2FlagUrl?: string
  group?: string
  ground: string
  homeScore?: number | null
  awayScore?: number | null
  finished?: boolean
  /** Minuto en vivo desde FIFA, ej "90'+4'"; null si no está en juego. */
  matchTime?: string | null
}

export interface GroupTeam {
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  flagUrl?: string
  conductScore?: number
}

export interface GroupStanding {
  group: string
  teams: GroupTeam[]
}

export interface BracketMatch {
  num: number
  round: string
  date: string
  time: string
  team1: string
  team2: string
  team1FlagUrl?: string
  team2FlagUrl?: string
  ground: string
}

export interface BracketRound {
  name: string
  side: "left" | "right" | "center"
  matches: BracketMatch[]
}

export interface TeamStat {
  name: string
  flagUrl?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  cleanSheets: number
}

export interface RecordMatch {
  team1: string
  team2: string
  team1FlagUrl?: string
  team2FlagUrl?: string
  homeScore: number
  awayScore: number
  round: string
  date: string
  totalGoals: number
  margin: number
}

export interface FairPlayTeam {
  name: string
  flagUrl?: string
  conductScore: number
}

export interface TournamentStats {
  teams: TeamStat[]
  totalGoals: number
  matchesPlayed: number
  totalMatches: number
  avgGoals: number
  blowouts: number
  biggestWin: RecordMatch | null
  highestScoring: RecordMatch | null
}

export interface PlayerStatRow {
  idPlayer: string
  name: string
  country: string
  flagUrl?: string
  value: number
  assists?: number
}

export interface PlayerLeaderboards {
  topScorers: PlayerStatRow[]
  topAssists: PlayerStatRow[]
  topYellowCards: PlayerStatRow[]
  topRedCards: PlayerStatRow[]
  topMinutes: PlayerStatRow[]
  topPasses: PlayerStatRow[]
  topShots: PlayerStatRow[]
  topDistance: PlayerStatRow[]
  topSaves: PlayerStatRow[]
}
