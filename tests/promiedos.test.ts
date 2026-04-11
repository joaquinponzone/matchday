import { describe, expect, test } from "bun:test"

import {
  externalMatchIdFromGameId,
  formatPromiedosGamesDate,
  promiedosStartTimeToUtcIso,
  teamKeyFromPromiedosId,
} from "@/lib/promiedos"

describe("promiedosStartTimeToUtcIso", () => {
  test("parses dd-MM-yyyy HH:mm as ART → UTC ISO", () => {
    const iso = promiedosStartTimeToUtcIso("11-04-2026 15:00")
    expect(iso).toBe("2026-04-11T18:00:00.000Z")
  })
})

describe("formatPromiedosGamesDate", () => {
  test("formats calendar day in America/Argentina/Buenos_Aires", () => {
    const d = new Date("2026-04-11T12:00:00.000Z")
    const s = formatPromiedosGamesDate(d, "America/Argentina/Buenos_Aires")
    expect(s).toMatch(/^\d{2}-\d{2}-\d{4}$/)
    expect(s).toBe("11-04-2026")
  })
})

describe("ids", () => {
  test("teamKey prefix", () => {
    expect(teamKeyFromPromiedosId("abc")).toBe("pm:abc")
  })
  test("external match id", () => {
    expect(externalMatchIdFromGameId("egdbgcb")).toBe("promiedos:egdbgcb")
  })
})
