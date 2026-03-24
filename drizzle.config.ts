import type { Config } from "drizzle-kit"

export default {
  dialect: "turso",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config
