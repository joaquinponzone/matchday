import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"

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
    "/((?!api/cron|login|register|forgot-password|reset-password|_next/static|_next/image|favicon).*)",
  ],
}
