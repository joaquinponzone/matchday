"use server"

import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { ResetPasswordSchema, type FormState } from "@/lib/validations"
import { getUserByResetToken } from "@/server/db/queries"
import { db } from "@/server/db/index"
import { users } from "@/server/db/schema"

export async function resetPassword(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = formData.get("token") as string
  if (!token) {
    return { error: "Missing reset token" }
  }

  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const user = await getUserByResetToken(tokenHash)

  if (!user || !user.resetTokenExpiresAt) {
    return { error: "Invalid or expired reset token" }
  }

  if (new Date(user.resetTokenExpiresAt) < new Date()) {
    return { error: "Reset token has expired" }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, user.id))

  return { success: "Password has been reset. You can now sign in." }
}
