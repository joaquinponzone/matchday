import "server-only"

import {
  fetchGamesForDate,
  filterGamesForTeamIds,
  mapPromiedosGameToMatch,
  promiedosIdFromTeamKey,
} from "@/lib/promiedos"
import type { DashboardFixture } from "@/lib/types"
import { APP_TIMEZONE } from "@/lib/utils"
import { getFollowedTeams, getTeam } from "@/server/db/queries"

const FALLBACK_DAYS_BACK = 0
const FALLBACK_DAYS_FORWARD = 45

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** Window used to load upcoming fixtures from Promiedos (same as `getUpcomingFixturesForUser`). */
export function getUpcomingWindowConfig(): {
  daysBack: number
  daysForward: number
} {
  return {
    daysBack: parseNonNegativeInt(
      process.env.PROMIEDOS_UPCOMING_DAYS_BACK,
      FALLBACK_DAYS_BACK,
    ),
    daysForward: parseNonNegativeInt(
      process.env.PROMIEDOS_UPCOMING_DAYS_FORWARD,
      FALLBACK_DAYS_FORWARD,
    ),
  }
}

function dateWindowDays(center: Date, daysBack: number, daysForward: number): Date[] {
  const days: Date[] = []
  for (let i = -daysBack; i <= daysForward; i++) {
    days.push(new Date(center.getTime() + i * 24 * 60 * 60 * 1000))
  }
  return days
}

/**
 * Loads upcoming scheduled fixtures for a user's followed teams from Promiedos.
 */
export async function getUpcomingFixturesForUser(
  userId: number,
  options?: {
    limit?: number
    daysBack?: number
    daysForward?: number
  },
): Promise<DashboardFixture[]> {
  const limit = options?.limit ?? 10
  const win = getUpcomingWindowConfig()
  const daysBack = options?.daysBack ?? win.daysBack
  const daysForward = options?.daysForward ?? win.daysForward

  const teamKeys = await getFollowedTeams(userId)
  const promiedosIds = new Set<string>()
  for (const key of teamKeys) {
    const id = promiedosIdFromTeamKey(key)
    if (id) promiedosIds.add(id)
  }
  if (promiedosIds.size === 0) return []

  const teamRows = await Promise.all(teamKeys.map((key) => getTeam(key)))
  const teamMetaByKey = new Map<
    string,
    { name: string; shortName: string; crest: string }
  >()
  teamKeys.forEach((key, i) => {
    const row = teamRows[i]
    if (!row) return
    teamMetaByKey.set(key, {
      name: row.name,
      shortName: row.shortName,
      crest: row.crest,
    })
  })

  const collected: DashboardFixture[] = []
  const seen = new Set<string>()
  const center = new Date()
  const nowIso = new Date().toISOString()

  const days = dateWindowDays(center, daysBack, daysForward)
  const rawByDay = await Promise.all(
    days.map((day) =>
      fetchGamesForDate(day, APP_TIMEZONE).catch((): null => null),
    ),
  )

  for (let i = 0; i < rawByDay.length; i++) {
    const raw = rawByDay[i]
    if (!raw) continue

    const filtered = filterGamesForTeamIds(raw, promiedosIds)
    for (const { league, game } of filtered) {
      for (const key of teamKeys) {
        const pid = promiedosIdFromTeamKey(key)
        if (!pid || !game.teams?.some((t) => t.id === pid)) continue
        const meta = teamMetaByKey.get(key)
        if (!meta) continue
        const row = mapPromiedosGameToMatch(league, game, pid, meta)
        const dedupeKey = `${row.externalMatchId}:${row.teamKey}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        if (row.status !== "scheduled") continue
        if (row.matchDate < nowIso) continue
        collected.push(row)
      }
    }
  }

  collected.sort((a, b) => a.matchDate.localeCompare(b.matchDate))
  return collected.slice(0, limit)
}
