import bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"

import { db } from "./index"
import { followedTeams, settings, teams, users } from "./schema"

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
    console.log("Admin user already exists, skipping user seed")
  } else {
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

    for (const key of ["61", "762"]) {
      await db
        .insert(followedTeams)
        .values({ userId: adminId, teamKey: key, enabled: 1 })
        .onConflictDoNothing()
    }
    console.log("Seeded followed teams (61=Chelsea, 762=Argentina)")
  }

  // Seed teams table
  await db
    .insert(teams)
    .values({
      apiId: 61,
      name: "Chelsea FC",
      shortName: "Chelsea",
      tla: "CHE",
      crest: "https://crests.football-data.org/61.png",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  await db
    .insert(teams)
    .values({
      apiId: 762,
      name: "Argentina",
      shortName: "Argentina",
      tla: "ARG",
      crest: "https://crests.football-data.org/762.png",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  console.log("Seeded teams table (Chelsea, Argentina)")

  // Migrate existing data from old string keys to numeric API IDs
  await db.run(
    sql`UPDATE matches SET team_key = '61' WHERE team_key = 'chelsea'`,
  )
  await db.run(
    sql`UPDATE matches SET team_key = '762' WHERE team_key = 'argentina'`,
  )
  await db.run(
    sql`UPDATE followed_teams SET team_key = '61' WHERE team_key = 'chelsea'`,
  )
  await db.run(
    sql`UPDATE followed_teams SET team_key = '762' WHERE team_key = 'argentina'`,
  )
  console.log("Migrated existing team keys to API IDs")
}

seed().catch(console.error)
