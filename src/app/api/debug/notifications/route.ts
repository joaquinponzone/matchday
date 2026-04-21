import { NextRequest, NextResponse } from "next/server"

import { APP_TIMEZONE } from "@/lib/utils"
import { processDailyDigestNotifications } from "@/lib/notifications"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

/**
 * Debug endpoint: runs the full notification pipeline in dry-run mode.
 * Returns the full timezone conversion chain (rawStartTime → computedMatchDateUtc → formattedArt)
 * without sending any messages. Useful for diagnosing timezone bugs.
 *
 * GET /api/debug/notifications
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const fetchedAt = new Date().toISOString()
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const artNow = new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date())

  try {
    const result = await processDailyDigestNotifications({ dryRun: true })
    return NextResponse.json({
      fetchedAt,
      serverTimezone,
      artNow,
      ...result,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        fetchedAt,
        serverTimezone,
        artNow,
      },
      { status: 500 },
    )
  }
}
