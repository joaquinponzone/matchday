"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"

import { isEmailConfigured } from "@/lib/email"
import { sessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"
import { LoginSchema } from "@/lib/validations"
import { getUserByEmail } from "@/server/db/queries"

type LoginState = {
  error?: string
  emailConfigured?: boolean
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const emailConfigured = isEmailConfigured()

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, emailConfigured }
  }

  const { email, password } = parsed.data
  const user = await getUserByEmail(email)

  if (!user) {
    return { error: "Invalid email or password", emailConfigured }
  }

  if (user.status === "pending") {
    return { error: "Your account is pending approval", emailConfigured }
  }

  if (user.status === "rejected") {
    return { error: "Your account has not been approved", emailConfigured }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: "Invalid email or password", emailConfigured }
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.userId = user.id
  await session.save()

  redirect("/")
}
