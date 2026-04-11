/**
 * Fixture domain + UI types (Promiedos on-demand, no persisted row).
 * Formerly split across `fixture-types` / `fixture-display`.
 */
export interface LiveFixture {
  externalMatchId: string
  teamKey: string
  opponent: string
  opponentLogo: string | null
  competition: string
  competitionLogo: string | null
  matchDate: string
  venue: string | null
  isHome: number
  status: string
  teamName: string | null
  teamShortName: string | null
  teamCrest: string | null
  teamScore: number | null
  opponentScore: number | null
  /** Best-effort link to the match on promiedos.com.ar when derivable from API slugs. */
  promiedosFixtureUrl: string | null
}

/** Upcoming fixture for dashboard / API (Promiedos on-demand, no DB row). */
export type DashboardFixture = LiveFixture

/** UI key: prefer legacy numeric id if present; else stable external id. */
export type FixtureForUi = LiveFixture & { id?: number }

export function fixtureUiKey(f: FixtureForUi): string {
  if (f.id != null) return String(f.id)
  return f.externalMatchId
}
