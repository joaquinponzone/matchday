import { NextResponse } from "next/server"

import { verifySession } from "@/lib/dal"
import {
  getUpcomingFixturesForUser,
  getUpcomingWindowConfig,
} from "@/lib/upcoming-fixtures"

export async function GET() {
  const { userId } = await verifySession()

  try {
    const window = getUpcomingWindowConfig()
    const fixtures = await getUpcomingFixturesForUser(userId, { limit: 15 })
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
