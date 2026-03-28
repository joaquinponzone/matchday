import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

import { sessionOptions, type SessionData } from "@/lib/session"
import { getSettings, updateSettings } from "@/server/db/queries"

async function getUserId() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return session.userId
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await getSettings(userId)
  if (!data) return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const updated = await updateSettings(userId, body)
  return NextResponse.json(updated)
}
