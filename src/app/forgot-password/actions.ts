"use server"

import crypto from "node:crypto"

import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email"
import { ForgotPasswordSchema, type FormState } from "@/lib/validations"
import { getUserByEmail } from "@/server/db/queries"
import { db } from "@/server/db/index"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export async function forgotPassword(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isEmailConfigured()) {
    return { error: "Email is not configured. Contact an admin." }
  }

  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email } = parsed.data
  const genericSuccess = "If an account with that email exists, a reset link has been sent."

  const user = await getUserByEmail(email)
  if (!user) {
    return { success: genericSuccess }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await db
    .update(users)
    .set({
      resetToken: tokenHash,
      resetTokenExpiresAt: expiresAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id))

  const appUrl = process.env.APP_URL ?? "http://localhost:3000"
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

  try {
    await sendPasswordResetEmail(email, resetUrl)
  } catch {
    return { error: "Failed to send reset email. Try again later." }
  }

  return { success: genericSuccess }
}
