import { NextRequest, NextResponse } from "next/server"

import { verifySession } from "@/lib/dal"
import { searchTeams } from "@/lib/football-data"

export async function GET(req: NextRequest) {
  await verifySession()

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) {
    return NextResponse.json(
      { error: "Query must be at least 3 characters" },
      { status: 400 },
    )
  }

  try {
    const teams = await searchTeams(q)
    return NextResponse.json({ teams })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
