import { db } from "./index"
import { followedTeams, settings } from "./schema"

async function seed() {
  const now = new Date().toISOString()

  await db
    .insert(settings)
    .values({
      id: 1,
      timezone: "America/Argentina/Buenos_Aires",
      emailEnabled: 0,
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

  console.log("Seeded default settings row (id=1)")

  for (const key of ["chelsea", "argentina"]) {
    await db
      .insert(followedTeams)
      .values({ teamKey: key, enabled: 1 })
      .onConflictDoNothing()
  }
  console.log("Seeded followed teams (chelsea, argentina)")
}

seed().catch(console.error)
