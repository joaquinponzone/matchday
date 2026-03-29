"use server"

import bcrypt from "bcryptjs"

import { RegisterSchema, type FormState } from "@/lib/validations"
import { db } from "@/server/db/index"
import {
  createUserSettings,
  getUserByEmail,
} from "@/server/db/queries"
import { users } from "@/server/db/schema"

export async function register(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password } = parsed.data

  const existing = await getUserByEmail(email)
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // First user becomes admin/active, subsequent users are pending
  const existingUsers = await db.select({ id: users.id }).from(users).limit(1)
  const isFirstUser = existingUsers.length === 0
  const role = isFirstUser ? "admin" : "user"
  const status = isFirstUser ? "active" : "pending"

  const now = new Date().toISOString()
  const inserted = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      role,
      status,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: users.id })

  const userId = inserted[0].id

  if (isFirstUser) {
    await createUserSettings(userId)
    return { success: "Account created! You can now sign in." }
  }

  return {
    success: "Account created! An admin will review your registration.",
  }
}
