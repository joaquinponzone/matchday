import { TEAM_META } from "@/lib/teams"
import { formatMatchDate } from "@/lib/utils"
import { createNotification, getMatchesBetween, getSettings, notificationExists } from "@/server/db/queries"
import type { Match, Settings } from "@/server/db/schema"
import type { TeamKey } from "@/lib/football-data"

import { sendTelegramMessage } from "./telegram"

interface NotificationContent {
  title: string
  body: string
}

export function buildNotificationContent(match: Match, settings: Settings): NotificationContent {
  const team = TEAM_META[match.teamKey as TeamKey]
  const venue = match.venue ?? "To be confirmed"
  const homeAway = match.isHome ? "vs" : "@"
  const dateStr = formatMatchDate(match.matchDate, settings.timezone)

  const title = `${team.shortName} ${homeAway} ${match.opponent} — ${match.competition}`
  const body = `${match.competition}\n${team.shortName} ${homeAway} ${match.opponent}\n📅 ${dateStr}\n📍 ${venue}`

  return { title, body }
}

type Channel = "telegram" | "in_app"
type Timing = "day_before" | "match_day"

async function dispatchNotification(
  match: Match,
  settings: Settings,
  channel: Channel,
  timing: Timing,
): Promise<void> {
  const idempotencyKey = `${match.id}_${channel}_${timing}`

  if (await notificationExists(idempotencyKey)) return

  const { title, body } = buildNotificationContent(match, settings)
  let status: "sent" | "failed" = "sent"
  let error: string | undefined

  try {
    if (channel === "telegram" && settings.telegramChatId) {
      await sendTelegramMessage(settings.telegramChatId, body)
    }
    // in_app: just persisted in DB, no external send needed
  } catch (err) {
    status = "failed"
    error = err instanceof Error ? err.message : "Unknown error"
  }

  await createNotification({
    matchId: match.id,
    channel,
    timing,
    idempotencyKey,
    status,
    title,
    body,
    error: error ?? null,
    sentAt: new Date().toISOString(),
  })
}

export async function processNotificationsForHour(): Promise<{
  processed: number
  errors: string[]
}> {
  const settings = await getSettings()
  if (!settings) return { processed: 0, errors: ["Settings not found"] }

  const now = new Date()
  const todayStart = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone }).format(now)
  const tomorrowStart = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone }).format(
    new Date(now.getTime() + 86400000),
  )

  const errors: string[] = []
  let processed = 0

  const channels: Channel[] = []
  if (settings.inAppEnabled) channels.push("in_app")
  if (settings.telegramEnabled && settings.telegramChatId) channels.push("telegram")

  if (settings.notifyMatchDay) {
    const todayMatches = await getMatchesBetween(
      `${todayStart}T00:00:00.000Z`,
      `${todayStart}T23:59:59.999Z`,
    )
    for (const match of todayMatches) {
      for (const channel of channels) {
        try {
          await dispatchNotification(match, settings, channel, "match_day")
          processed++
        } catch (err) {
          errors.push(`${channel}/${match.id}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }
  }

  if (settings.notifyDayBefore) {
    const tomorrowMatches = await getMatchesBetween(
      `${tomorrowStart}T00:00:00.000Z`,
      `${tomorrowStart}T23:59:59.999Z`,
    )
    for (const match of tomorrowMatches) {
      for (const channel of channels) {
        try {
          await dispatchNotification(match, settings, channel, "day_before")
          processed++
        } catch (err) {
          errors.push(`${channel}/${match.id}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }
  }

  return { processed, errors }
}
