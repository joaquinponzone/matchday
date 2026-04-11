import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

import { sessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"
import { getNotifications } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const channel = searchParams.get("channel") ?? undefined
  const status = searchParams.get("status") ?? undefined

  const data = await getNotifications(session.userId, { channel, status })
  return NextResponse.json(data)
}
