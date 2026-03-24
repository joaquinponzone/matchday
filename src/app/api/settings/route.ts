import { NextRequest, NextResponse } from "next/server"

import { getSettings, updateSettings } from "@/server/db/queries"

export async function GET() {
  const data = await getSettings()
  if (!data) return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const updated = await updateSettings(body)
  return NextResponse.json(updated)
}
