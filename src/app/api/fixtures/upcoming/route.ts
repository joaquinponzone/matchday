import { NextResponse } from "next/server"

import { verifySession } from "@/lib/dal"
import {
  getUpcomingFixturesForUser,
  getUpcomingWindowConfig,
} from "@/lib/upcoming-fixtures"
import { getSettings } from "@/server/db/queries"

export async function GET() {
  const { userId } = await verifySession()
  const settings = await getSettings(userId)
  const tz = settings?.timezone ?? "America/Argentina/Buenos_Aires"

  try {
    const window = getUpcomingWindowConfig()
    const fixtures = await getUpcomingFixturesForUser(userId, {
      limit: 15,
      timeZone: tz,
    })
    return NextResponse.json({
      fixtures,
      upcomingDaysBack: window.daysBack,
      upcomingDaysForward: window.daysForward,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
