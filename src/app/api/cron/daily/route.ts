import { NextRequest, NextResponse } from "next/server"

import { fetchUpcomingFixtures, mapFixtureToMatch, type TeamKey } from "@/lib/football-data"
import { processNotificationsForHour } from "@/lib/notifications"
import { getFollowedTeams, upsertMatch } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Sync fixtures
  let upserted = 0
  try {
    const teamKeys = (await getFollowedTeams()) as TeamKey[]
    const fixtures = await Promise.all(teamKeys.map((k) => fetchUpcomingFixtures(k)))
    for (const [i, team] of teamKeys.entries()) {
      for (const f of fixtures[i]) {
        await upsertMatch(mapFixtureToMatch(f, team))
        upserted++
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `sync failed: ${message}` }, { status: 500 })
  }

  // 2. Send notifications
  const { processed, errors } = await processNotificationsForHour()

  return NextResponse.json({ ok: true, upserted, processed, errors })
}
