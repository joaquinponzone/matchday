export interface WCMatch {
  round: string
  num?: number
  date: string
  time: string
  team1: string
  team2: string
  group?: string
  ground: string
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
  ground: string
}

export interface BracketRound {
  name: string
  side: "left" | "right" | "center"
  matches: BracketMatch[]
}
