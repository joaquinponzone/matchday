import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api/cron|login|register|forgot-password|reset-password|api/debug/notifications|_next/static|_next/image|favicon).*)",
  ],
}
