import { and, desc, eq, gte, lte, or } from "drizzle-orm"

import { db } from "./index"
import { type InsertMatch, type InsertNotification, followedTeams, matches, notifications, settings } from "./schema"

// Settings

export async function getSettings() {
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  return rows[0] ?? null
}

export async function updateSettings(data: Partial<typeof settings.$inferInsert>) {
  await db
    .update(settings)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(settings.id, 1))
  return getSettings()
}

// Followed Teams

export async function getFollowedTeams(): Promise<string[]> {
  const rows = await db.select().from(followedTeams).where(eq(followedTeams.enabled, 1))
  return rows.map((r) => r.teamKey)
}

export async function setTeamEnabled(teamKey: string, enabled: boolean) {
  await db
    .insert(followedTeams)
    .values({ teamKey, enabled: enabled ? 1 : 0 })
    .onConflictDoUpdate({
      target: followedTeams.teamKey,
      set: { enabled: enabled ? 1 : 0 },
    })
}

// Matches

export async function getUpcomingMatches(limit = 5) {
  const now = new Date().toISOString()
  return db
    .select()
    .from(matches)
    .where(and(gte(matches.matchDate, now), eq(matches.status, "scheduled")))
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

// Notifications

export async function getNotifications(filters?: { channel?: string; status?: string }) {
  const conditions = []
  if (filters?.channel) conditions.push(eq(notifications.channel, filters.channel))
  if (filters?.status) conditions.push(eq(notifications.status, filters.status))

  const query = db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))

  if (conditions.length === 0) return query
  if (conditions.length === 1) return query.where(conditions[0])
  return query.where(and(...conditions))
}

export async function createNotification(data: InsertNotification) {
  return db.insert(notifications).values(data).onConflictDoNothing()
}

export async function markNotificationRead(id: number) {
  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date().toISOString() })
    .where(eq(notifications.id, id))
}

export async function getUnreadCount() {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.channel, "in_app"), eq(notifications.status, "sent")))
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
