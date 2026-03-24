import { NextRequest, NextResponse } from "next/server"

import { markNotificationRead } from "@/server/db/queries"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await markNotificationRead(Number(id))
  return NextResponse.json({ ok: true })
}
