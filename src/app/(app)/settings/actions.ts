"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import type { TeamKind } from "@/server/db/schema"
import { getSettings, isNicknameTaken, setTeamEnabled, updateUserName, updateUserNickname, upsertTeam } from "@/server/db/queries"
import { sendTelegramMessage } from "@/lib/telegram"
import { buildNotificationContent } from "@/lib/notifications"
import type { LiveFixture } from "@/lib/fixture.types"

function buildTomorrow14Iso(tz: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(now)
  const y = Number(parts.find((p) => p.type === "year")?.value)
  const m = Number(parts.find((p) => p.type === "month")?.value)
  const d = Number(parts.find((p) => p.type === "day")?.value)
  const tomorrowLocal = new Date(Date.UTC(y, m - 1, d + 1, 14, 0, 0))
  const tzOffset = new Date(tomorrowLocal.toLocaleString("en-US", { timeZone: tz })).getTime() - tomorrowLocal.getTime()
  return new Date(tomorrowLocal.getTime() - tzOffset).toISOString()
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
    const tz = s.timezone ?? "America/Argentina/Buenos_Aires"
    const sample: LiveFixture = {
      externalMatchId: "sample:test",
      teamKey: "pm:sample",
      opponent: "Manchester United",
      opponentLogo: null,
      competition: "Premier League (Test)",
      competitionLogo: null,
      matchDate: buildTomorrow14Iso(tz),
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
    const { telegramHtml } = buildNotificationContent(sample, tz, "day_before")
    await sendTelegramMessage(
      s.telegramChatId,
      `${telegramHtml}`,
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
