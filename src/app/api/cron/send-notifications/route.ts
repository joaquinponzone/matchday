import { NextRequest, NextResponse } from "next/server"

/**
 * Legacy: notifications are handled in GET /api/cron/daily (single daily run).
 * Kept so old Vercel cron URLs return 200 without duplicating sends.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    deprecated: true,
    message: "Use GET /api/cron/daily for notifications (daily digest).",
  })
}
