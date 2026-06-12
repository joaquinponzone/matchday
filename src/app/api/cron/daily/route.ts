import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { processDailyDigestNotifications } from "@/lib/notifications"
import { syncProdeResults } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Notifications from live Promiedos fetch
  let processed = 0
  let notificationErrors: string[] = []
  try {
    const result = await processDailyDigestNotifications()
    if ("processed" in result) {
      processed = result.processed
    }
    notificationErrors = result.errors
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `notifications failed: ${message}` }, { status: 500 })
  }

  // 2. Prode: finished World Cup matches
  let prodeCalculated = 0
  try {
    const result = await syncProdeResults()
    prodeCalculated = result.calculated
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors: notificationErrors,
    prodeCalculated,
  })
}
