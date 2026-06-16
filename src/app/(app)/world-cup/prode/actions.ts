"use server"

import { revalidatePath } from "next/cache"
import { getUser, requireAdmin } from "@/lib/dal"
import { fetchAllWCMatches } from "@/lib/fifa"
import {
  getMatchPredictions,
  syncProdeResults,
  upsertProdePrediction,
} from "@/server/db/queries"
import { toUtcIso } from "../lib"

export type MatchPrediction = Awaited<
  ReturnType<typeof getMatchPredictions>
>[number]

type MatchPredictionsResult =
  | { error: string }
  | { predictions: MatchPrediction[] }

export async function savePrediction(
  matchNumber: number,
  homeScore: number,
  awayScore: number
) {
  const user = await getUser()

  const matches = await fetchAllWCMatches()
  const match = matches.find((m) => m.num === matchNumber)
  if (!match) return { error: "Partido no encontrado" }

  const kickoff = new Date(toUtcIso(match.date, match.time))
  if (new Date() >= kickoff) return { error: "El partido ya comenzó" }

  await upsertProdePrediction({
    userId: user.id,
    matchNumber,
    homeScore,
    awayScore,
  })

  return { success: true }
}

// All players' predictions for a match — only revealed once it has kicked off,
// so predictions stay private while they're still editable.
export async function getMatchPredictionsAction(
  matchNumber: number
): Promise<MatchPredictionsResult> {
  await getUser()

  const matches = await fetchAllWCMatches()
  const match = matches.find((m) => m.num === matchNumber)
  if (!match) return { error: "Partido no encontrado" }

  const kickoff = new Date(toUtcIso(match.date, match.time))
  if (new Date() < kickoff) {
    return { error: "El partido todavía no comenzó" }
  }

  const predictions = await getMatchPredictions(matchNumber)
  return { predictions }
}

// Admin-only: manually sync finished World Cup results and award prode points.
// Lets the admin trigger the calculation on-demand (e.g. right after a match
// ends) instead of waiting for the once-a-day cron. Uses a fresh FIFA fetch.
export async function syncProdeResultsAction() {
  await requireAdmin()
  try {
    const result = await syncProdeResults({ fresh: true })
    revalidatePath("/world-cup")
    return { success: true as const, ...result }
  } catch {
    return { error: "No se pudieron sincronizar los resultados" }
  }
}
