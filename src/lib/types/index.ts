/**
 * Public type surface for `@/lib`. Definitions stay in domain modules; this file
 * re-exports only. Do not import from here inside `promiedos` or `notifications`
 * (would create circular resolution with this barrel).
 */
export type {
  DashboardFixture,
  FixtureForUi,
  LiveFixture,
} from "@/lib/fixture.types"
export type {
  PromiedosGame,
  PromiedosGamesResponse,
  PromiedosLeague,
  PromiedosSearchTeamResult,
  PromiedosTeam,
} from "@/lib/promiedos"
export type { MatchNotificationTiming } from "@/lib/notifications"
export type { SessionData } from "@/lib/session"
export type { FormState } from "@/lib/validations"
