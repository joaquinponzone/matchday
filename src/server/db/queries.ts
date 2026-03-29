import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm"

import { db } from "./index"
import {
  type InsertMatch,
  type InsertNotification,
  followedTeams,
  matches,
  notifications,
  settings,
  teams,
  users,
} from "./schema"

// Users

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0] ?? null
}

export async function getUserByResetToken(tokenHash: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, tokenHash))
    .limit(1)
  return rows[0] ?? null
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt))
}

export async function updateUserStatus(userId: number, status: string) {
  await db
    .update(users)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
}

export async function updateUserRole(userId: number, role: string) {
  await db
    .update(users)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
}

export async function getAllActiveUsersWithSettings() {
  return db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      telegramChatId: settings.telegramChatId,
      timezone: settings.timezone,
      telegramEnabled: settings.telegramEnabled,
      inAppEnabled: settings.inAppEnabled,
      notifyDayBefore: settings.notifyDayBefore,
      notifyMatchDay: settings.notifyMatchDay,
      dayBeforeHour: settings.dayBeforeHour,
      matchDayHour: settings.matchDayHour,
    })
    .from(users)
    .innerJoin(settings, eq(users.id, settings.userId))
    .where(eq(users.status, "active"))
}

export async function getAllFollowedTeamKeys(): Promise<number[]> {
  const rows = await db
    .select({ teamKey: followedTeams.teamKey })
    .from(followedTeams)
    .innerJoin(users, eq(followedTeams.userId, users.id))
    .where(and(eq(followedTeams.enabled, 1), eq(users.status, "active")))
  const unique = [...new Set(rows.map((r) => Number(r.teamKey)))]
  return unique
}

// Settings

export async function getSettings(userId: number) {
  const rows = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)
  return rows[0] ?? null
}

export async function updateSettings(userId: number, data: Partial<typeof settings.$inferInsert>) {
  await db
    .update(settings)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(settings.userId, userId))
  return getSettings(userId)
}

export async function createUserSettings(userId: number) {
  const now = new Date().toISOString()
  await db
    .insert(settings)
    .values({
      userId,
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
}

// Followed Teams

export async function getFollowedTeams(userId: number): Promise<number[]> {
  const rows = await db
    .select()
    .from(followedTeams)
    .where(and(eq(followedTeams.userId, userId), eq(followedTeams.enabled, 1)))
  return rows.map((r) => Number(r.teamKey))
}

export async function setTeamEnabled(userId: number, teamKey: string, enabled: boolean) {
  await db
    .insert(followedTeams)
    .values({ userId, teamKey, enabled: enabled ? 1 : 0 })
    .onConflictDoUpdate({
      target: [followedTeams.userId, followedTeams.teamKey],
      set: { enabled: enabled ? 1 : 0 },
    })
}

// Teams

export async function getTeam(apiId: number) {
  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.apiId, apiId))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertTeam(data: {
  apiId: number
  name: string
  shortName: string
  tla: string
  crest: string
}) {
  await db
    .insert(teams)
    .values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: teams.apiId,
      set: {
        name: data.name,
        shortName: data.shortName,
        tla: data.tla,
        crest: data.crest,
        updatedAt: new Date().toISOString(),
      },
    })
}

export async function getFollowedTeamsWithMeta(userId: number) {
  return db
    .select({
      apiId: teams.apiId,
      name: teams.name,
      shortName: teams.shortName,
      crest: teams.crest,
      enabled: followedTeams.enabled,
    })
    .from(followedTeams)
    .innerJoin(
      teams,
      sql`CAST(${followedTeams.teamKey} AS INTEGER) = ${teams.apiId}`,
    )
    .where(and(eq(followedTeams.userId, userId), eq(followedTeams.enabled, 1)))
}

// Matches

export async function getUpcomingMatches(teamKeys: string[], limit = 5) {
  const now = new Date().toISOString()
  return db
    .select()
    .from(matches)
    .where(
      and(
        gte(matches.matchDate, now),
        eq(matches.status, "scheduled"),
        teamKeys.length > 0 ? inArray(matches.teamKey, teamKeys) : undefined,
      ),
    )
    .orderBy(matches.matchDate)
    .limit(limit)
}

export async function upsertMatch(data: InsertMatch) {
  const existing = await db
    .select()
    .from(matches)
    .where(eq(matches.apiFootballId, data.apiFootballId))
    .limit(1)

  if (existing[0]) {
    await db
      .update(matches)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(matches.apiFootballId, data.apiFootballId))
    return existing[0].id
  }

  const inserted = await db.insert(matches).values(data).returning({ id: matches.id })
  return inserted[0].id
}

export async function getMatchesBetween(from: string, to: string) {
  return db
    .select()
    .from(matches)
    .where(and(gte(matches.matchDate, from), lte(matches.matchDate, to)))
}

export async function getNextUpcomingMatch() {
  const now = new Date().toISOString()
  const rows = await db
    .select()
    .from(matches)
    .where(and(gte(matches.matchDate, now), eq(matches.status, "scheduled")))
    .orderBy(matches.matchDate)
    .limit(1)
  return rows[0] ?? null
}

// Notifications

export async function getNotifications(
  userId: number,
  filters?: { channel?: string; status?: string },
) {
  const conditions = [eq(notifications.userId, userId)]
  if (filters?.channel) conditions.push(eq(notifications.channel, filters.channel))
  if (filters?.status) conditions.push(eq(notifications.status, filters.status))

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
}

export async function createNotification(data: InsertNotification) {
  return db.insert(notifications).values(data).onConflictDoNothing()
}

export async function markNotificationRead(userId: number, id: number) {
  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
}

export async function getUnreadCount(userId: number) {
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.channel, "in_app"),
        eq(notifications.status, "sent"),
      ),
    )
  return rows.length
}

export async function notificationExists(idempotencyKey: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.idempotencyKey, idempotencyKey))
    .limit(1)
  return rows.length > 0
}
