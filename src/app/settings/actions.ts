"use server"

import { revalidatePath } from "next/cache"
import { getSettings, setTeamEnabled } from "@/server/db/queries"
import { sendTelegramMessage } from "@/lib/telegram"

export async function toggleTeam(teamKey: string, enabled: boolean) {
  await setTeamEnabled(teamKey, enabled)
  revalidatePath("/settings")
}

export async function testTelegramNotification(): Promise<{ ok: boolean; error?: string }> {
  const s = await getSettings()
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
