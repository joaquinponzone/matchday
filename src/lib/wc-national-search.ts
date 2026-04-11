import { fetchFifaWCNationalTeamsForSearch } from "@/lib/fifa"
import {
  fetchMundialPromiedosTeamsIndex,
  type PromiedosSearchTeamResult,
} from "@/lib/promiedos"

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "")
}

function norm(s: string): string {
  return stripDiacritics(s.toLowerCase().trim()).replace(/\s+/g, " ")
}

function isLikelyFemaleVariant(name: string): boolean {
  const n = name.toLowerCase()
  return (
    /\(\s*f\s*\)/.test(n) ||
    n.includes("femenino") ||
    n.includes("femenina") ||
    n.includes("women")
  )
}

function fifaMatchesQuery(
  nameEs: string,
  abbrev: string,
  qNorm: string,
): boolean {
  if (qNorm.length < 3) return false
  if (norm(nameEs).includes(qNorm)) return true
  const a = abbrev.toLowerCase()
  return a === qNorm || a.startsWith(qNorm)
}

function promiedosCandidatesForFifa(
  pmTeams: PromiedosSearchTeamResult[],
  fifaName: string,
  fifaAbbrev: string,
): PromiedosSearchTeamResult[] {
  const nFifa = norm(fifaName)
  const abbrevU = fifaAbbrev.toUpperCase()

  return pmTeams.filter((pm) => {
    if (pm.tla === abbrevU) return true
    if (norm(pm.name) === nFifa) return true
    if (norm(pm.shortName) === nFifa) return true
    if (norm(pm.name).startsWith(nFifa + " ")) return true
    return false
  })
}

function pickBestPromiedos(
  candidates: PromiedosSearchTeamResult[],
  fifaName: string,
): PromiedosSearchTeamResult | null {
  if (candidates.length === 0) return null
  const nFifa = norm(fifaName)

  const exactName = candidates.filter((c) => norm(c.name) === nFifa)
  if (exactName.length) {
    const nonF = exactName.filter((c) => !isLikelyFemaleVariant(c.name))
    return nonF[0] ?? exactName[0]!
  }

  const nonFemale = candidates.filter((c) => !isLikelyFemaleVariant(c.name))
  return nonFemale[0] ?? candidates[0]!
}

/**
 * Search WC national teams: FIFA names/flags + Promiedos `pm:` keys from Mundial
 * fixtures index. Only returns rows with a Promiedos match so sync/notifications work.
 */
export async function searchWcNationalTeamsForSettings(
  query: string,
): Promise<PromiedosSearchTeamResult[]> {
  const qRaw = query.trim().toLowerCase()
  if (qRaw.length < 3) return []

  const qNorm = norm(qRaw)

  const [fifaTeams, pmIndex] = await Promise.all([
    fetchFifaWCNationalTeamsForSearch(),
    fetchMundialPromiedosTeamsIndex(),
  ])

  const seenPmKeys = new Set<string>()
  const out: PromiedosSearchTeamResult[] = []

  const fifaFiltered = fifaTeams.filter((ft) =>
    fifaMatchesQuery(ft.nameEs, ft.abbreviation, qNorm),
  )

  fifaFiltered.sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"))

  for (const ft of fifaFiltered) {
    const candidates = promiedosCandidatesForFifa(
      pmIndex,
      ft.nameEs,
      ft.abbreviation,
    )
    const pm = pickBestPromiedos(candidates, ft.nameEs)
    if (!pm || seenPmKeys.has(pm.teamKey)) continue
    seenPmKeys.add(pm.teamKey)

    const crest = ft.flagUrl ?? pm.crest
    out.push({
      ...pm,
      name: ft.nameEs,
      shortName: ft.abbreviation || pm.shortName,
      crest,
    })
    if (out.length >= 20) break
  }

  return out
}
