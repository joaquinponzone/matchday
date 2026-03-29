"use server"

import { requireAdmin } from "@/lib/dal"
import { fetchWorldCupMatches } from "@/lib/football-data"

export async function checkWcApiStatus(): Promise<{
  count: number
  firstMatch: string | null
}> {
  await requireAdmin()
  const matches = await fetchWorldCupMatches()
  return {
    count: matches.length,
    firstMatch: matches[0]?.utcDate ?? null,
  }
}
