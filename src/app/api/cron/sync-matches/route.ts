import { NextRequest, NextResponse } from "next/server"

/**
 * @deprecated Removed: fixtures load via Promiedos on-demand (`/api/fixtures/upcoming`).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(
    {
      ok: false,
      deprecated: true,
      message: "Gone: no DB match sync. Use Promiedos on-demand fixtures.",
    },
    { status: 410 },
  )
}
