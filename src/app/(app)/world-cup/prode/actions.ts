"use server"

import { getUser } from "@/lib/dal"
import { fetchAllWCMatches } from "@/lib/fifa"
import { upsertProdePrediction } from "@/server/db/queries"
import { toUtcIso } from "../lib"

export async function savePrediction(
  matchNumber: number,
  homeScore: number,
  awayScore: number,
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
