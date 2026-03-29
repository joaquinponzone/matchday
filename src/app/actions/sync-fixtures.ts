"use server"

import { revalidatePath } from "next/cache"
import { fetchUpcomingFixtures, mapFixtureToMatch } from "@/lib/football-data"
import { verifySession } from "@/lib/dal"
import { getFollowedTeams, getTeam, upsertMatch } from "@/server/db/queries"

export async function syncFixtures() {
  const { userId } = await verifySession()
  const teamIds = await getFollowedTeams(userId)
  for (const teamApiId of teamIds) {
    const team = await getTeam(teamApiId)
    if (!team) continue
    const fixtures = await fetchUpcomingFixtures(teamApiId)
    const teamMeta = {
      name: team.name,
      shortName: team.shortName,
      crest: team.crest,
    }
    for (const f of fixtures) {
      await upsertMatch(mapFixtureToMatch(f, teamApiId, teamMeta))
    }
  }
  revalidatePath("/")
}
