import { APP_TIMEZONE, formatMatchTimeOnly } from "@/lib/utils"
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

export interface NotificationDiagnosticEntry {
  userId: number
  channel: string
  timing: string
  teamKey: string
  externalMatchId: string
  rawStartTime: string
  computedMatchDateUtc: string
  formattedArt: string
  alreadySent: boolean
}

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
  timing: MatchNotificationTiming,
): NotificationContent {
  const followedName = match.teamShortName ?? match.teamKey
  const local = (match.isHome ? followedName : match.opponent) ?? ""
  const visitor = (match.isHome ? match.opponent : followedName) ?? ""
  const venue = match.venue?.trim() || null
  const relativeLabel = timing === "match_day" ? "Hoy" : "Mañana"
  const timeStr = formatMatchTimeOnly(match.matchDate)

  const title = `${local} vs. ${visitor} — ${match.competition}`
  const bodyLines = [
    `🏆 ${match.competition}\n`,
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

  console.log(`[cron/daily] dispatch ${timing}/${channel} ${match.externalMatchId}: matchDate=${match.matchDate} formatted=${formatMatchTimeOnly(match.matchDate)}`)
  const { title, body, telegramHtml } = buildNotificationContent(match, timing)
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
 * Daily digest: fetch Promiedos for today/tomorrow (Argentina wall clock),
 * then notify for followed teams.
 *
 * Pass `dryRun: true` to skip actual sends and return a full diagnostic
 * of what would be dispatched (useful for debugging timezone issues).
 */
export async function processDailyDigestNotifications(options?: {
  dryRun?: boolean
}): Promise<
  | { processed: number; errors: string[] }
  | { dryRun: true; would_send: NotificationDiagnosticEntry[]; errors: string[] }
> {
  const dryRun = options?.dryRun ?? false
  const allUsers = await getAllActiveUsersWithSettings()
  if (allUsers.length === 0) return { processed: 0, errors: [] }

  const errors: string[] = []
  let processed = 0
  const diagnostics: NotificationDiagnosticEntry[] = []

  let rawToday: Awaited<ReturnType<typeof fetchGamesForDate>>
  let rawTomorrow: Awaited<ReturnType<typeof fetchGamesForDate>>
  try {
    rawToday = await fetchGamesForDate(new Date(), APP_TIMEZONE)
    rawTomorrow = await fetchGamesForDate(
      new Date(Date.now() + 86400000),
      APP_TIMEZONE,
    )
    console.log("[cron/daily] Promiedos fetch diagnostic:", {
      fetchedAt: new Date().toISOString(),
      sampleTodayTimes: rawToday.leagues?.flatMap((l) =>
        (l.games ?? []).map((g) => ({
          teams: g.teams?.map((t) => t.short_name).join(" vs "),
          start_time: g.start_time,
        })),
      ).slice(0, 5),
      sampleTomorrowTimes: rawTomorrow.leagues?.flatMap((l) =>
        (l.games ?? []).map((g) => ({
          teams: g.teams?.map((t) => t.short_name).join(" vs "),
          start_time: g.start_time,
        })),
      ).slice(0, 5),
    })
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
    return { processed, errors }
  }

  for (const userSettings of allUsers) {
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
            if (dryRun) {
              const idempotencyKey = `${userSettings.userId}_${row.externalMatchId}_${row.teamKey}_${channel}_${timing}`
              diagnostics.push({
                userId: userSettings.userId,
                channel,
                timing,
                teamKey: row.teamKey,
                externalMatchId: row.externalMatchId,
                rawStartTime: game.start_time,
                computedMatchDateUtc: row.matchDate,
                formattedArt: formatMatchTimeOnly(row.matchDate),
                alreadySent: await notificationExists(idempotencyKey),
              })
            } else {
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
    }

    if (userSettings.notifyMatchDay) {
      await dispatchForTiming(rawToday, "match_day")
    }

    if (userSettings.notifyDayBefore) {
      await dispatchForTiming(rawTomorrow, "day_before")
    }
  }

  if (dryRun) {
    return { dryRun: true, would_send: diagnostics, errors }
  }
  return { processed, errors }
}

/** @deprecated Use processDailyDigestNotifications */
export async function processNotificationsForHour() {
  return processDailyDigestNotifications()
}
