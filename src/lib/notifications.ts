import { formatMatchTimeOnly } from "@/lib/utils"
import {
  createNotification,
  getAllActiveUsersWithSettings,
  getFollowedTeams,
  getMatchesBetween,
  notificationExists,
} from "@/server/db/queries"
import type { Match } from "@/server/db/schema"

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
  match: Match,
  timezone: string,
  timing: MatchNotificationTiming,
): NotificationContent {
  const followedName = match.teamShortName ?? match.teamKey
  const local = match.isHome ? followedName : match.opponent
  const visitor = match.isHome ? match.opponent : followedName
  const venue = match.venue ?? "To be confirmed"
  const relativeLabel = timing === "match_day" ? "hoy" : "mañana"
  const timeStr = formatMatchTimeOnly(match.matchDate, timezone)

  const title = `${local} vs ${visitor} — ${match.competition}`
  const body = `${match.competition}\n${local}\nvs\n${visitor}\n📅 ${relativeLabel} - ${timeStr}\n📍 ${venue}`

  const esc = escapeHtml
  const telegramHtml = [
    `<b>${esc(match.competition)}</b>`,
    esc(local),
    "vs",
    esc(visitor),
    `📅 ${esc(relativeLabel)} - ${esc(timeStr)}`,
    `📍 ${esc(venue)}`,
  ].join("\n")

  return { title, body, telegramHtml }
}

type Channel = "telegram" | "in_app"
type Timing = MatchNotificationTiming

async function dispatchNotification(
  userId: number,
  match: Match,
  userSettings: UserSettings,
  channel: Channel,
  timing: Timing,
): Promise<void> {
  const idempotencyKey = `${userId}_${match.id}_${channel}_${timing}`

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
  const allUsers = await getAllActiveUsersWithSettings()
  if (allUsers.length === 0) return { processed: 0, errors: [] }

  const errors: string[] = []
  let processed = 0

  for (const userSettings of allUsers) {
    const now = new Date()
    const todayStart = new Intl.DateTimeFormat("en-CA", {
      timeZone: userSettings.timezone,
    }).format(now)
    const tomorrowStart = new Intl.DateTimeFormat("en-CA", {
      timeZone: userSettings.timezone,
    }).format(new Date(now.getTime() + 86400000))

    const channels: Channel[] = []
    if (userSettings.inAppEnabled) channels.push("in_app")
    if (userSettings.telegramEnabled && userSettings.telegramChatId) channels.push("telegram")
    if (channels.length === 0) continue

    const userTeams = await getFollowedTeams(userSettings.userId)

    if (userSettings.notifyMatchDay) {
      const todayMatches = await getMatchesBetween(
        `${todayStart}T00:00:00.000Z`,
        `${todayStart}T23:59:59.999Z`,
      )
      const userTodayMatches = todayMatches.filter((m) =>
        userTeams.includes(Number(m.teamKey)),
      )
      for (const match of userTodayMatches) {
        for (const channel of channels) {
          try {
            await dispatchNotification(userSettings.userId, match, userSettings, channel, "match_day")
            processed++
          } catch (err) {
            errors.push(`user:${userSettings.userId}/${channel}/${match.id}: ${err instanceof Error ? err.message : err}`)
          }
        }
      }
    }

    if (userSettings.notifyDayBefore) {
      const tomorrowMatches = await getMatchesBetween(
        `${tomorrowStart}T00:00:00.000Z`,
        `${tomorrowStart}T23:59:59.999Z`,
      )
      const userTomorrowMatches = tomorrowMatches.filter((m) =>
        userTeams.includes(Number(m.teamKey)),
      )
      for (const match of userTomorrowMatches) {
        for (const channel of channels) {
          try {
            await dispatchNotification(userSettings.userId, match, userSettings, channel, "day_before")
            processed++
          } catch (err) {
            errors.push(`user:${userSettings.userId}/${channel}/${match.id}: ${err instanceof Error ? err.message : err}`)
          }
        }
      }
    }
  }

  return { processed, errors }
}
