import { formatMatchTimeOnly } from "@/lib/utils"
import type { LiveFixture } from "@/lib/fixture.types"
import {
  fetchGamesForDate,
  filterGamesForTeamIds,
  mapPromiedosGameToMatch,
  promiedosIdFromTeamKey,
} from "@/lib/promiedos"
import {
  createNotification,
  getAllActiveUsersWithSettings,
  getFollowedTeams,
  getTeam,
  notificationExists,
} from "@/server/db/queries"

import { sendTelegramMessage } from "./telegram"

export type MatchNotificationTiming = "day_before" | "match_day"

interface NotificationContent {
  title: string
  body: string
  telegramHtml: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

interface UserSettings {
  userId: number
  timezone: string
  telegramChatId: string | null
  telegramEnabled: number
  inAppEnabled: number
  notifyDayBefore: number
  notifyMatchDay: number
  dayBeforeHour: number
  matchDayHour: number
}

export function buildNotificationContent(
  match: LiveFixture,
  timezone: string,
  timing: MatchNotificationTiming,
): NotificationContent {
  const followedName = match.teamShortName ?? match.teamKey
  const local = (match.isHome ? followedName : match.opponent) ?? ""
  const visitor = (match.isHome ? match.opponent : followedName) ?? ""
  const venue = match.venue?.trim() || null
  const relativeLabel = timing === "match_day" ? "Hoy" : "Mañana"
  const timeStr = formatMatchTimeOnly(match.matchDate, timezone)

  const title = `${local} vs. ${visitor} — ${match.competition}`
  const bodyLines = [
    `🏆 <b>${match.competition}</b>\n`,
    `▶️ ${local} vs. ${visitor}`,
    `📅 ${relativeLabel} ${timeStr} hs`,
  ]
  if (venue) bodyLines.push(`📍 ${venue}`)
  const body = bodyLines.join("\n")

  const esc = escapeHtml
  const telegramLines = [
    `🏆 <b>${esc(match.competition)}</b>\n`,
    `▶️ ${esc(local)} vs. ${esc(visitor)}`,
    `📅 ${esc(relativeLabel)} ${esc(timeStr)} hs`,
  ]
  if (venue) telegramLines.push(`📍 ${esc(venue)}`)
  const telegramHtml = telegramLines.join("\n")

  return { title, body, telegramHtml }
}

type Channel = "telegram" | "in_app"
type Timing = MatchNotificationTiming

async function dispatchNotification(
  userId: number,
  match: LiveFixture,
  userSettings: UserSettings,
  channel: Channel,
  timing: Timing,
): Promise<void> {
  const idempotencyKey = `${userId}_${match.externalMatchId}_${match.teamKey}_${channel}_${timing}`

  if (await notificationExists(idempotencyKey)) return

  const { title, body, telegramHtml } = buildNotificationContent(
    match,
    userSettings.timezone,
    timing,
  )
  let status: "sent" | "failed" = "sent"
  let error: string | undefined

  try {
    if (channel === "telegram" && userSettings.telegramChatId) {
      await sendTelegramMessage(userSettings.telegramChatId, telegramHtml)
    }
  } catch (err) {
    status = "failed"
    error = err instanceof Error ? err.message : "Unknown error"
  }

  await createNotification({
    userId,
    channel,
    timing,
    idempotencyKey,
    status,
    title,
    body,
    error: error ?? null,
    sentAt: new Date().toISOString(),
    promiedosFixtureUrl: match.promiedosFixtureUrl,
  })
}

/**
 * Daily digest: fetch Promiedos for today / tomorrow per user timezone (grouped),
 * then notify for followed teams.
 */
export async function processDailyDigestNotifications(): Promise<{
  processed: number
  errors: string[]
}> {
  const allUsers = await getAllActiveUsersWithSettings()
  if (allUsers.length === 0) return { processed: 0, errors: [] }

  const byTz = new Map<string, typeof allUsers>()
  for (const u of allUsers) {
    const list = byTz.get(u.timezone) ?? []
    list.push(u)
    byTz.set(u.timezone, list)
  }

  const errors: string[] = []
  let processed = 0

  for (const [tz, usersInTz] of byTz) {
    let rawToday: Awaited<ReturnType<typeof fetchGamesForDate>>
    let rawTomorrow: Awaited<ReturnType<typeof fetchGamesForDate>>
    try {
      rawToday = await fetchGamesForDate(new Date(), tz)
      rawTomorrow = await fetchGamesForDate(
        new Date(Date.now() + 86400000),
        tz,
      )
    } catch (err) {
      errors.push(
        `tz:${tz}: ${err instanceof Error ? err.message : String(err)}`,
      )
      continue
    }

    for (const userSettings of usersInTz) {
      const channels: Channel[] = []
      if (userSettings.inAppEnabled) channels.push("in_app")
      if (userSettings.telegramEnabled && userSettings.telegramChatId) {
        channels.push("telegram")
      }
      if (channels.length === 0) continue

      const userTeams = await getFollowedTeams(userSettings.userId)
      const promiedosIds = new Set<string>()
      for (const key of userTeams) {
        const id = promiedosIdFromTeamKey(key)
        if (id) promiedosIds.add(id)
      }
      if (promiedosIds.size === 0) continue

      const teamMetaByKey = new Map<
        string,
        { name: string; shortName: string; crest: string }
      >()
      for (const key of userTeams) {
        const row = await getTeam(key)
        if (!row) continue
        teamMetaByKey.set(key, {
          name: row.name,
          shortName: row.shortName,
          crest: row.crest,
        })
      }

      const dispatchForTiming = async (
        raw: typeof rawToday,
        timing: Timing,
      ) => {
        const filtered = filterGamesForTeamIds(raw, promiedosIds)
        for (const { league, game } of filtered) {
          for (const key of userTeams) {
            const pid = promiedosIdFromTeamKey(key)
            if (!pid || !game.teams?.some((t) => t.id === pid)) continue
            const meta = teamMetaByKey.get(key)
            if (!meta) continue
            const row = mapPromiedosGameToMatch(league, game, pid, meta)
            if (row.status !== "scheduled") continue
            for (const channel of channels) {
              try {
                await dispatchNotification(
                  userSettings.userId,
                  row,
                  userSettings,
                  channel,
                  timing,
                )
                processed++
              } catch (err) {
                errors.push(
                  `user:${userSettings.userId}/${channel}/${row.externalMatchId}: ${err instanceof Error ? err.message : err}`,
                )
              }
            }
          }
        }
      }

      if (userSettings.notifyMatchDay) {
        await dispatchForTiming(rawToday, "match_day")
      }

      if (userSettings.notifyDayBefore) {
        await dispatchForTiming(rawTomorrow, "day_before")
      }
    }
  }

  return { processed, errors }
}

/** @deprecated Use processDailyDigestNotifications */
export async function processNotificationsForHour() {
  return processDailyDigestNotifications()
}
