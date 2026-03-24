import { NextRequest, NextResponse } from "next/server"

import { getNotifications } from "@/server/db/queries"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const channel = searchParams.get("channel") ?? undefined
  const status = searchParams.get("status") ?? undefined

  const data = await getNotifications({ channel, status })
  return NextResponse.json(data)
}
