import { NextRequest, NextResponse } from "next/server"

import { verifySession } from "@/lib/dal"
import { searchPromiedosTeams } from "@/lib/promiedos"
import { searchWcNationalTeamsForSettings } from "@/lib/wc-national-search"

export async function GET(req: NextRequest) {
  await verifySession()

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  const scopeRaw = req.nextUrl.searchParams.get("scope")?.trim().toLowerCase()
  const scopeNations = scopeRaw === "nations" || scopeRaw === "national"

  if (q.length < 3) {
    return NextResponse.json(
      { error: "Query must be at least 3 characters" },
      { status: 400 },
    )
  }

  try {
    const raw = scopeNations
      ? await searchWcNationalTeamsForSettings(q)
      : await searchPromiedosTeams(q)
    const teams = raw.map((t) => ({
      teamKey: t.teamKey,
      id: t.teamKey,
      name: t.name,
      shortName: t.shortName,
      tla: t.tla,
      crest: t.crest,
      urlName: t.urlName,
    }))
    return NextResponse.json({ teams })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
