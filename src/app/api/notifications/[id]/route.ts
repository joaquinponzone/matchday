import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

import { sessionOptions, type SessionData } from "@/lib/session"
import { markNotificationRead } from "@/server/db/queries"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await markNotificationRead(session.userId, Number(id))
  return NextResponse.json({ ok: true })
}
