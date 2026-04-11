"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { sessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"

export async function logout() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.destroy()
  redirect("/login")
}
