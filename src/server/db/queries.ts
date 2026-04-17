"use server"

import { and, desc, eq, isNull, sql } from "drizzle-orm"

import { db } from "./index"
import {
  type InsertNotification,
  type TeamKind,
  followedTeams,
  notifications,
  prodePredictions,
  settings,
  teams,
  users,
} from "./schema"
import { revalidatePath } from "next/cache"

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

export async function getAllFollowedTeamKeys(): Promise<string[]> {
  const rows = await db
    .select({ teamKey: followedTeams.teamKey })
    .from(followedTeams)
    .innerJoin(users, eq(followedTeams.userId, users.id))
    .where(and(eq(followedTeams.enabled, 1), eq(users.status, "active")))
  return [...new Set(rows.map((r) => r.teamKey))]
}

export async function deactivateUser(userId: number) {
  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))

  revalidatePath("/admin/users")
}

export async function activateUser(userId: number) {
  await db
    .update(users)
    .set({ status: "active", updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))

  revalidatePath("/admin/users")
}

export async function updateUserName(userId: number, name: string) {
  await db
    .update(users)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
}

export async function updateUserNickname(userId: number, nickname: string) {
  await db
    .update(users)
    .set({ nickname, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
}

export async function isNicknameTaken(nickname: string, excludeUserId: number) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.nickname, nickname), sql`${users.id} != ${excludeUserId}`))
    .limit(1)
  return rows.length > 0
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

export async function getFollowedTeams(userId: number): Promise<string[]> {
  const rows = await db
    .select()
    .from(followedTeams)
    .where(and(eq(followedTeams.userId, userId), eq(followedTeams.enabled, 1)))
  return rows.map((r) => r.teamKey)
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

export async function getTeam(teamKey: string) {
  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.teamKey, teamKey))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertTeam(data: {
  teamKey: string
  name: string
  shortName: string
  tla: string
  crest: string
  teamKind: TeamKind
  promiedosUrlName?: string | null
}) {
  await db
    .insert(teams)
    .values({
      teamKey: data.teamKey,
      name: data.name,
      shortName: data.shortName,
      tla: data.tla,
      crest: data.crest,
      teamKind: data.teamKind,
      promiedosUrlName: data.promiedosUrlName ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: teams.teamKey,
      set: {
        name: data.name,
        shortName: data.shortName,
        tla: data.tla,
        crest: data.crest,
        teamKind: data.teamKind,
        promiedosUrlName: data.promiedosUrlName ?? null,
        updatedAt: new Date().toISOString(),
      },
    })
}

export async function getFollowedTeamsWithMeta(userId: number) {
  const rows = await db
    .select({
      teamKey: teams.teamKey,
      name: teams.name,
      shortName: teams.shortName,
      crest: teams.crest,
      teamKind: teams.teamKind,
      enabled: followedTeams.enabled,
    })
    .from(followedTeams)
    .innerJoin(teams, eq(followedTeams.teamKey, teams.teamKey))
    .where(and(eq(followedTeams.userId, userId), eq(followedTeams.enabled, 1)))

  return rows.map((r) => ({
    ...r,
    teamKind: r.teamKind as TeamKind,
  }))
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

// Prode

export async function getUserPredictions(userId: number) {
  return db
    .select()
    .from(prodePredictions)
    .where(eq(prodePredictions.userId, userId))
}

export async function getMatchPredictions(matchNumber: number) {
  return db
    .select({
      id: prodePredictions.id,
      userId: prodePredictions.userId,
      matchNumber: prodePredictions.matchNumber,
      homeScore: prodePredictions.homeScore,
      awayScore: prodePredictions.awayScore,
      points: prodePredictions.points,
      userName: sql<string>`COALESCE(${users.nickname}, ${users.name})`,
    })
    .from(prodePredictions)
    .innerJoin(users, eq(prodePredictions.userId, users.id))
    .where(eq(prodePredictions.matchNumber, matchNumber))
}

export async function getProdeLeaderboard() {
  return db
    .select({
      userId: users.id,
      name: sql<string>`COALESCE(${users.nickname}, ${users.name})`,
      email: users.email,
      totalPoints: sql<number>`COALESCE(SUM(${prodePredictions.points}), 0)`,
      exactCount: sql<number>`COUNT(CASE WHEN ${prodePredictions.points} = 3 THEN 1 END)`,
      correctCount: sql<number>`COUNT(CASE WHEN ${prodePredictions.points} = 1 THEN 1 END)`,
    })
    .from(users)
    .leftJoin(prodePredictions, eq(users.id, prodePredictions.userId))
    .where(eq(users.status, "active"))
    .groupBy(users.id, users.name, users.nickname, users.email)
    .orderBy(
      desc(sql`COALESCE(SUM(${prodePredictions.points}), 0)`),
      desc(sql`COUNT(CASE WHEN ${prodePredictions.points} = 3 THEN 1 END)`),
    )
}

export async function upsertProdePrediction(data: {
  userId: number
  matchNumber: number
  homeScore: number
  awayScore: number
}) {
  const now = new Date().toISOString()
  await db
    .insert(prodePredictions)
    .values({ ...data, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [prodePredictions.userId, prodePredictions.matchNumber],
      set: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        updatedAt: now,
      },
    })
}

export async function calculateMatchPoints(
  matchNumber: number,
  realHome: number,
  realAway: number,
) {
  const preds = await db
    .select()
    .from(prodePredictions)
    .where(
      and(
        eq(prodePredictions.matchNumber, matchNumber),
        isNull(prodePredictions.points),
      ),
    )

  for (const pred of preds) {
    let points = 0
    if (pred.homeScore === realHome && pred.awayScore === realAway) {
      points = 3
    } else {
      const outcome = (h: number, a: number) => (h > a ? "1" : h < a ? "2" : "X")
      if (outcome(pred.homeScore, pred.awayScore) === outcome(realHome, realAway)) {
        points = 1
      }
    }
    await db
      .update(prodePredictions)
      .set({ points, updatedAt: new Date().toISOString() })
      .where(eq(prodePredictions.id, pred.id))
  }
}
