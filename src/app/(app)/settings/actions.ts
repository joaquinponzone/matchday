"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import type { TeamKind } from "@/server/db/schema"
import { getSettings, isNicknameTaken, setTeamEnabled, updateUserName, updateUserNickname, upsertTeam } from "@/server/db/queries"
import { sendTelegramMessage } from "@/lib/telegram"
import { buildNotificationContent } from "@/lib/notifications"
import { APP_TIMEZONE } from "@/lib/utils"
import type { LiveFixture } from "@/lib/fixture.types"

/**
 * ISO for tomorrow at 14:00 Argentina time. Used as a sample `matchDate`
 * on the Telegram test notification so the formatter renders a realistic value.
 */
function buildTomorrow14IsoAr(): string {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const y = Number(nowParts.find((p) => p.type === "year")?.value)
  const m = Number(nowParts.find((p) => p.type === "month")?.value)
  const d = Number(nowParts.find((p) => p.type === "day")?.value)
  // Argentina is UTC-3 (no DST), so 14:00 AR == 17:00 UTC.
  return new Date(Date.UTC(y, m - 1, d + 1, 17, 0, 0)).toISOString()
}

export async function followTeam(
  teamKey: string,
  name: string,
  shortName: string,
  tla: string,
  crest: string,
  teamKind: TeamKind,
  promiedosUrlName?: string | null,
) {
  const { userId } = await verifySession()
  await upsertTeam({
    teamKey,
    name,
    shortName,
    tla,
    crest,
    teamKind,
    promiedosUrlName: promiedosUrlName ?? null,
  })
  await setTeamEnabled(userId, teamKey, true)

  revalidatePath("/")
  revalidatePath("/settings")
}

export async function unfollowTeam(teamKey: string) {
  const { userId } = await verifySession()
  await setTeamEnabled(userId, teamKey, false)
  revalidatePath("/")
  revalidatePath("/settings")
}

export async function updateDisplayName(name: string) {
  const { userId } = await verifySession()
  const trimmed = name.trim()
  if (!trimmed) return
  await updateUserName(userId, trimmed)
  revalidatePath("/settings")
}

export async function updateNickname(nickname: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await verifySession()
  const trimmed = nickname.trim().toLowerCase().replace(/\s+/g, "_")
  if (!trimmed) return { ok: false, error: "El nickname no puede estar vacío." }
  if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
    return { ok: false, error: "Solo letras, números y _ (3-20 caracteres)." }
  }
  const taken = await isNicknameTaken(trimmed, userId)
  if (taken) return { ok: false, error: "Este nickname ya está en uso." }
  await updateUserNickname(userId, trimmed)
  revalidatePath("/settings")
  revalidatePath("/prode")
  return { ok: true }
}

export async function testTelegramNotification(): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await verifySession()
  const s = await getSettings(userId)
  if (!s?.telegramEnabled || !s.telegramChatId) {
    return { ok: false, error: "Telegram is not enabled or chat ID is missing." }
  }
  try {
    const sample: LiveFixture = {
      externalMatchId: "sample:test",
      teamKey: "pm:sample",
      opponent: "Manchester United",
      opponentLogo: null,
      competition: "Premier League (Test)",
      competitionLogo: null,
      matchDate: buildTomorrow14IsoAr(),
      venue: null,
      isHome: 1,
      status: "scheduled",
      teamName: "Chelsea",
      teamShortName: "Chelsea",
      teamCrest: null,
      teamScore: null,
      opponentScore: null,
      promiedosFixtureUrl: null,
    }
    const { telegramHtml } = buildNotificationContent(sample, "day_before")
    await sendTelegramMessage(s.telegramChatId, telegramHtml)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
