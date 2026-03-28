import bcrypt from "bcryptjs"

import { db } from "./index"
import { followedTeams, settings, users } from "./schema"

async function seed() {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    throw new Error("ADMIN_EMAIL env var is required for seeding")
  }

  const password = process.env.ADMIN_PASSWORD ?? "changeme123"
  const passwordHash = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()

  const inserted = await db
    .insert(users)
    .values({
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: users.id })

  const adminId = inserted[0]?.id
  if (!adminId) {
    console.log("Admin user already exists, skipping seed")
    return
  }

  console.log(`Seeded admin user (id=${adminId}, email=${email})`)

  await db
    .insert(settings)
    .values({
      userId: adminId,
      timezone: "America/Argentina/Buenos_Aires",
      telegramEnabled: 0,
      inAppEnabled: 1,
      notifyDayBefore: 1,
      notifyMatchDay: 1,
      dayBeforeHour: 20,
      matchDayHour: 9,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  console.log("Seeded settings for admin user")

  for (const key of ["chelsea", "argentina"]) {
    await db
      .insert(followedTeams)
      .values({ userId: adminId, teamKey: key, enabled: 1 })
      .onConflictDoNothing()
  }
  console.log("Seeded followed teams (chelsea, argentina)")
}

seed().catch(console.error)
