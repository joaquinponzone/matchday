"use server"

import { revalidatePath } from "next/cache"
import { fetchUpcomingFixtures, mapFixtureToMatch, type TeamKey } from "@/lib/football-data"
import { getFollowedTeams, upsertMatch } from "@/server/db/queries"

export async function syncFixtures() {
  const teamKeys = (await getFollowedTeams()) as TeamKey[]
  const fixtures = await Promise.all(teamKeys.map((k) => fetchUpcomingFixtures(k)))
  for (const [i, team] of teamKeys.entries()) {
    for (const f of fixtures[i]) {
      await upsertMatch(mapFixtureToMatch(f, team))
    }
  }
  revalidatePath("/upcoming-matches")
}
