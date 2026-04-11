/**
 * Drops every user table and view in the configured SQLite DB (full wipe).
 *
 *   ALLOW_DB_NUKE=1 bun run db:nuke
 *   bun run db:push
 *   bun run db:seed
 *
 * Seed needs `ADMIN_EMAIL` in `.env` (optional `ADMIN_PASSWORD`, default changeme123).
 */

import { createClient } from "@libsql/client"

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN

if (!url) {
  console.error("Database URL not set (TURSO_DATABASE_URL or DATABASE_URL)")
  process.exit(1)
}

if (process.env.ALLOW_DB_NUKE !== "1") {
  console.error(
    "Refusing to run: set ALLOW_DB_NUKE=1 to wipe the database (dev only).",
  )
  process.exit(1)
}

const client = createClient({ url, authToken })

const objects = await client.execute({
  sql: `SELECT type, name FROM sqlite_master
        WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
        ORDER BY CASE type WHEN 'view' THEN 0 ELSE 1 END, name`,
  args: [],
})

const views = objects.rows.filter((r) => r.type === "view")
const tables = objects.rows.filter((r) => r.type === "table")

if (views.length === 0 && tables.length === 0) {
  console.log("No tables or views to drop.")
  process.exit(0)
}

console.log(
  `Dropping ${views.length} view(s), ${tables.length} table(s) on ${maskUrl(url)}`,
)

await client.execute("PRAGMA foreign_keys=OFF")

for (const row of views) {
  const name = String(row.name)
  await client.execute(`DROP VIEW IF EXISTS "${name.replace(/"/g, '""')}"`)
  console.log(`  dropped view ${name}`)
}

for (const row of tables) {
  const name = String(row.name)
  await client.execute(`DROP TABLE IF EXISTS "${name.replace(/"/g, '""')}"`)
  console.log(`  dropped table ${name}`)
}

await client.execute("PRAGMA foreign_keys=ON")

console.log(
  "Done. Run `bun run db:push` then `bun run db:seed` (ADMIN_EMAIL in .env).",
)

function maskUrl(u: string): string {
  try {
    const parsed = new URL(u)
    if (parsed.password) parsed.password = "***"
    return parsed.toString()
  } catch {
    return u.startsWith("file:") ? u : "[remote]"
  }
}
