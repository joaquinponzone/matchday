import { NextRequest, NextResponse } from "next/server"

import { fetchUpcomingFixtures, mapFixtureToMatch, type TeamKey } from "@/lib/football-data"
import { getAllFollowedTeamKeys, upsertMatch } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teamKeys = (await getAllFollowedTeamKeys()) as TeamKey[]
    const fixtures = await Promise.all(teamKeys.map((k) => fetchUpcomingFixtures(k)))

    let upserted = 0
    for (const [i, team] of teamKeys.entries()) {
      for (const f of fixtures[i]) {
        await upsertMatch(mapFixtureToMatch(f, team))
        upserted++
      }
    }

    return NextResponse.json({ ok: true, upserted })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
