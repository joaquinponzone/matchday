"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { fetchUpcomingFixtures, mapFixtureToMatch } from "@/lib/football-data"
import { getSettings, setTeamEnabled, updateUserName, upsertMatch, upsertTeam } from "@/server/db/queries"
import { sendTelegramMessage } from "@/lib/telegram"

export async function followTeam(
  apiId: number,
  name: string,
  shortName: string,
  tla: string,
  crest: string,
) {
  const { userId } = await verifySession()
  await upsertTeam({ apiId, name, shortName, tla, crest })
  await setTeamEnabled(userId, String(apiId), true)

  // Sync fixtures immediately so matches appear without waiting for cron
  try {
    const fixtures = await fetchUpcomingFixtures(apiId)
    const teamMeta = { name, shortName, crest }
    for (const f of fixtures) {
      await upsertMatch(mapFixtureToMatch(f, apiId, teamMeta))
    }
  } catch {
    // Non-fatal — fixtures will sync on next cron run
  }

  revalidatePath("/")
  revalidatePath("/settings")
}

export async function unfollowTeam(apiId: number) {
  const { userId } = await verifySession()
  await setTeamEnabled(userId, String(apiId), false)
  revalidatePath("/settings")
}

export async function updateDisplayName(name: string) {
  const { userId } = await verifySession()
  const trimmed = name.trim()
  if (!trimmed) return
  await updateUserName(userId, trimmed)
  revalidatePath("/settings")
}

export async function testTelegramNotification(): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await verifySession()
  const s = await getSettings(userId)
  if (!s?.telegramEnabled || !s.telegramChatId) {
    return { ok: false, error: "Telegram is not enabled or chat ID is missing." }
  }
  try {
    await sendTelegramMessage(
      s.telegramChatId,
      "✅ <b>Matchday test</b>\nTelegram notifications are working correctly.",
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
