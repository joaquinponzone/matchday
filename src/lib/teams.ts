import type { TeamKey } from "@/lib/football-data"

export interface TeamMeta {
  key: TeamKey
  name: string
  shortName: string
  crestUrl: string
}

export const TEAM_META: Record<TeamKey, TeamMeta> = {
  chelsea: {
    key: "chelsea",
    name: "Chelsea FC",
    shortName: "Chelsea",
    crestUrl: "https://crests.football-data.org/61.png",
  },
  argentina: {
    key: "argentina",
    name: "Argentina",
    shortName: "Argentina",
    crestUrl: "https://crests.football-data.org/762.png",
  },
}
