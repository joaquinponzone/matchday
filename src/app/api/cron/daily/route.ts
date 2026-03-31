import { NextRequest, NextResponse } from "next/server"

import { fetchUpcomingFixtures, mapFixtureToMatch } from "@/lib/football-data"
import { processNotificationsForHour } from "@/lib/notifications"
import { fetchFinishedWCMatchScores } from "@/lib/fifa"
import { getAllFollowedTeamKeys, getTeam, upsertMatch, calculateMatchPoints } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Sync fixtures for all active users' followed teams
  let upserted = 0
  try {
    const teamIds = await getAllFollowedTeamKeys()
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
        upserted++
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `sync failed: ${message}` }, { status: 500 })
  }

  // 2. Send notifications for all active users
  const { processed, errors } = await processNotificationsForHour()

  // 3. Calculate prode points for finished World Cup matches
  let prodeCalculated = 0
  try {
    const finishedMatches = await fetchFinishedWCMatchScores()
    for (const { matchNumber, homeScore, awayScore } of finishedMatches) {
      await calculateMatchPoints(matchNumber, homeScore, awayScore)
      prodeCalculated++
    }
  } catch {
    // Non-critical: don't fail the whole cron if prode calculation fails
  }

  return NextResponse.json({ ok: true, upserted, processed, errors, prodeCalculated })
}
