import bcrypt from "bcryptjs"

import { promiedosTeamCrestUrl } from "@/lib/promiedos"

import { db } from "./index"
import { followedTeams, settings, teams, users } from "./schema"

/** Demo Promiedos team ids (Liga Profesional samples from api.promiedos.com.ar). */
const SEED_TEAMS: {
  promiedosId: string
  name: string
  shortName: string
  tla: string
  urlName: string
}[] = [
  {
    promiedosId: "ihb",
    name: "Argentinos Juniors",
    shortName: "Argentinos",
    tla: "ARJ",
    urlName: "argentinos-juniors",
  },
  {
    promiedosId: "hchc",
    name: "Instituto",
    shortName: "Instituto",
    tla: "INS",
    urlName: "instituto-ac-cordoba",
  },
]

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

    for (const t of SEED_TEAMS) {
      const teamKey = `pm:${t.promiedosId}`
      await db
        .insert(followedTeams)
        .values({ userId: adminId, teamKey, enabled: 1 })
        .onConflictDoNothing()
    }
    console.log("Seeded followed teams (Promiedos demo clubs)")
  }

  for (const t of SEED_TEAMS) {
    const teamKey = `pm:${t.promiedosId}`
    await db
      .insert(teams)
      .values({
        teamKey,
        name: t.name,
        shortName: t.shortName,
        tla: t.tla,
        crest: promiedosTeamCrestUrl(t.promiedosId),
        teamKind: "club",
        promiedosUrlName: t.urlName,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
  }

  console.log("Seeded teams table (Promiedos)")
}

seed().catch(console.error)
