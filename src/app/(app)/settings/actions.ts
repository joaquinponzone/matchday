"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import type { TeamKind } from "@/server/db/schema"
import { getSettings, isNicknameTaken, setTeamEnabled, updateUserName, updateUserNickname, upsertTeam } from "@/server/db/queries"
import { sendTelegramMessage } from "@/lib/telegram"

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
    await sendTelegramMessage(
      s.telegramChatId,
      "✅ <b>Dia de partido ⚽️ test</b>\nTelegram notifications are working correctly.",
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
