import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"


export const teams = sqliteTable("teams", {
  apiId: integer("api_id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tla: text("tla").notNull(),
  crest: text("crest").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  nickname: text("nickname").unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("pending"),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: text("reset_token_expires_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
})

export const settings = sqliteTable("settings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  telegramChatId: text("telegram_chat_id"),
  timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
  telegramEnabled: integer("telegram_enabled").notNull().default(0),
  inAppEnabled: integer("in_app_enabled").notNull().default(1),
  notifyDayBefore: integer("notify_day_before").notNull().default(1),
  notifyMatchDay: integer("notify_match_day").notNull().default(1),
  dayBeforeHour: integer("day_before_hour").notNull().default(20),
  matchDayHour: integer("match_day_hour").notNull().default(9),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
})

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  apiFootballId: integer("api_football_id").notNull().unique(),
  teamKey: text("team_key").notNull().default("chelsea"),
  opponent: text("opponent").notNull(),
  opponentLogo: text("opponent_logo"),
  competition: text("competition").notNull(),
  competitionLogo: text("competition_logo"),
  matchDate: text("match_date").notNull(),
  venue: text("venue"),
  isHome: integer("is_home").notNull().default(1),
  status: text("status").notNull().default("scheduled"),
  teamName: text("team_name"),
  teamShortName: text("team_short_name"),
  teamCrest: text("team_crest"),
  teamScore: integer("team_score"),
  opponentScore: integer("opponent_score"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
})

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id),
    channel: text("channel").notNull(),
    timing: text("timing").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("sent"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    error: text("error"),
    sentAt: text("sent_at"),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("idempotency_key_idx").on(table.idempotencyKey)],
)

export const followedTeams = sqliteTable(
  "followed_teams",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    teamKey: text("team_key").notNull(),
    enabled: integer("enabled").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.userId, table.teamKey] })],
)

export const prodePredictions = sqliteTable(
  "prode_predictions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    matchNumber: integer("match_number").notNull(),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    points: integer("points"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("prode_user_match_idx").on(table.userId, table.matchNumber)],
)

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Settings = typeof settings.$inferSelect
export type Match = typeof matches.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type FollowedTeam = typeof followedTeams.$inferSelect
export type InsertMatch = typeof matches.$inferInsert
export type InsertNotification = typeof notifications.$inferInsert
export type Team = typeof teams.$inferSelect
export type InsertTeam = typeof teams.$inferInsert
export type ProdePrediction = typeof prodePredictions.$inferSelect
export type InsertProdePrediction = typeof prodePredictions.$inferInsert
