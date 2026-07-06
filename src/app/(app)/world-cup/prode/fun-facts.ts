import type { WCMatch } from "../types"

// Predicción tal como la devuelve `getAllProdePredictions()`.
export interface ProdePrediction {
  userId: number
  matchNumber: number
  homeScore: number
  awayScore: number
  points: number | null
  bonus: number | null
  userName: string
}

export interface TeamValue {
  name: string
  flagUrl?: string
  value: number
}

export interface UserTeamFact {
  userName: string
  team: string
  flagUrl?: string
  value: number
}

export interface UserValue {
  userName: string
  value: number
}

export interface RecordMatchFact {
  team1: string
  team2: string
  team1FlagUrl?: string
  team2FlagUrl?: string
  homeScore: number
  awayScore: number
  round: string
  count: number
}

export interface ProdeFunFacts {
  hasData: boolean
  // Selección que más puntos le dio a cada usuario.
  favouriteTeamByUser: UserTeamFact[]
  // Selección que más fallos le causó a cada usuario.
  jinxTeamByUser: UserTeamFact[]
  // Selecciones con más plenos acertados (agregado, todos los usuarios).
  mostExactByTeam: TeamValue[]
  // Reyes del empate (acertados) y del empate exacto.
  drawKings: UserValue[]
  exactDrawKings: UserValue[]
  // Reyes de la victoria (aciertos) y de la derrota (fallos) en partidos que
  // terminaron con ganador (resultado decisivo, no empate).
  victoryKings: UserValue[]
  defeatKings: UserValue[]
  // Reyes de la victoria/derrota exacta: acertaron el marcador exacto de un
  // partido que ganó el local (a favor) o el visitante (en contra).
  exactVictoryKings: UserValue[]
  exactDefeatKings: UserValue[]
  // Partido con más plenos y partido con más fallos.
  mostAccuratedMatch: RecordMatchFact | null
  cursedMatch: RecordMatchFact | null
  // Goleadores del prode: promedio de goles pronosticados por partido.
  topScorer: { userName: string; avg: number } | null
  bottomScorer: { userName: string; avg: number } | null
}

interface MatchInfo {
  team1: string
  team2: string
  team1FlagUrl?: string
  team2FlagUrl?: string
  round: string
  homeScore: number | null | undefined
  awayScore: number | null | undefined
  finished: boolean
}

const emptyFacts: ProdeFunFacts = {
  hasData: false,
  favouriteTeamByUser: [],
  jinxTeamByUser: [],
  mostExactByTeam: [],
  drawKings: [],
  exactDrawKings: [],
  victoryKings: [],
  defeatKings: [],
  exactVictoryKings: [],
  exactDefeatKings: [],
  mostAccuratedMatch: null,
  cursedMatch: null,
  topScorer: null,
  bottomScorer: null,
}

// Acumula un valor sobre una clave dentro de un mapa.
function bump<K>(map: Map<K, number>, key: K, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by)
}

// Para las tablas "por usuario/equipo" nos quedamos con el mejor valor de cada
// usuario; desempate por valor (ya implícito) y luego alfabético por equipo.
function topPerUser(
  perUser: Map<string, Map<string, number>>,
  teamFlag: Map<string, string | undefined>
): UserTeamFact[] {
  const rows: UserTeamFact[] = []
  for (const [userName, teams] of perUser) {
    let best: { team: string; value: number } | null = null
    for (const [team, value] of teams) {
      if (
        !best ||
        value > best.value ||
        (value === best.value && team.localeCompare(best.team) < 0)
      ) {
        best = { team, value }
      }
    }
    if (best && best.value > 0) {
      rows.push({
        userName,
        team: best.team,
        flagUrl: teamFlag.get(best.team),
        value: best.value,
      })
    }
  }
  return rows.sort((a, b) => b.value - a.value)
}

export function computeProdeFunFacts(
  predictions: ProdePrediction[],
  matches: WCMatch[]
): ProdeFunFacts {
  if (predictions.length === 0) return emptyFacts

  // Índice de partidos por número, con equipos y banderas.
  const matchByNum = new Map<number, MatchInfo>()
  const teamFlag = new Map<string, string | undefined>()
  for (const m of matches) {
    if (m.num === undefined) continue
    matchByNum.set(m.num, {
      team1: m.team1,
      team2: m.team2,
      team1FlagUrl: m.team1FlagUrl,
      team2FlagUrl: m.team2FlagUrl,
      round: m.round,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      finished:
        m.finished === true &&
        typeof m.homeScore === "number" &&
        typeof m.awayScore === "number",
    })
    if (m.team1FlagUrl) teamFlag.set(m.team1, m.team1FlagUrl)
    if (m.team2FlagUrl) teamFlag.set(m.team2, m.team2FlagUrl)
  }

  // Acumuladores.
  const pointsByUserTeam = new Map<string, Map<string, number>>()
  const missByUserTeam = new Map<string, Map<string, number>>()
  const exactByTeam = new Map<string, number>()
  const drawsCorrect = new Map<string, number>()
  const drawsExact = new Map<string, number>()
  const decisiveCorrect = new Map<string, number>()
  const decisiveMissed = new Map<string, number>()
  const exactVictoryWins = new Map<string, number>()
  const exactDefeatWins = new Map<string, number>()
  const exactPerMatch = new Map<number, number>()
  const missPerMatch = new Map<number, number>()
  // Goles pronosticados por usuario (todas las predicciones cargadas).
  const goalsByUser = new Map<string, { total: number; count: number }>()

  const ensureUser = (map: Map<string, Map<string, number>>, user: string) => {
    let m = map.get(user)
    if (!m) {
      m = new Map()
      map.set(user, m)
    }
    return m
  }

  let hasEvaluated = false

  for (const p of predictions) {
    // Goleadores: usa toda predicción cargada, jugada o no.
    const g = goalsByUser.get(p.userName) ?? { total: 0, count: 0 }
    g.total += p.homeScore + p.awayScore
    g.count += 1
    goalsByUser.set(p.userName, g)

    const info = matchByNum.get(p.matchNumber)
    if (!info) continue

    // El resto de las curiosidades solo aplican a partidos ya evaluados.
    if (p.points === null) continue
    hasEvaluated = true

    const pts = (p.points ?? 0) + (p.bonus ?? 0)
    const teams = [
      { name: info.team1 },
      { name: info.team2 },
    ]

    // Selección fetiche / yeta: acreditamos a ambos equipos del partido.
    for (const t of teams) {
      if (pts > 0) bump(ensureUser(pointsByUserTeam, p.userName), t.name, pts)
      // Fallo real: 0 puntos y 0 bonus.
      if (p.points === 0 && (p.bonus ?? 0) === 0) {
        bump(ensureUser(missByUserTeam, p.userName), t.name)
      }
      // Plenos por selección (agregado).
      if (p.points === 2) bump(exactByTeam, t.name)
    }

    // Récords por partido.
    if (p.points === 2) bump(exactPerMatch, p.matchNumber)
    if (p.points === 0 && (p.bonus ?? 0) === 0) bump(missPerMatch, p.matchNumber)

    // Reyes del empate: el resultado real fue empate.
    if (
      info.finished &&
      typeof info.homeScore === "number" &&
      typeof info.awayScore === "number" &&
      info.homeScore === info.awayScore
    ) {
      if (pts > 0) bump(drawsCorrect, p.userName)
      if (p.points === 2) bump(drawsExact, p.userName)
    }

    // Reyes de la victoria/derrota: el resultado real tuvo ganador (no empate).
    if (
      info.finished &&
      typeof info.homeScore === "number" &&
      typeof info.awayScore === "number" &&
      info.homeScore !== info.awayScore
    ) {
      if (pts > 0) bump(decisiveCorrect, p.userName)
      if (p.points === 0 && (p.bonus ?? 0) === 0) bump(decisiveMissed, p.userName)

      // Victoria/derrota exacta: acertó el marcador exacto (points === 2) de un
      // partido definido. El signo del margen separa a favor del local
      // (victoria) o del visitante (derrota).
      if (p.points === 2) {
        if (info.homeScore > info.awayScore) bump(exactVictoryWins, p.userName)
        else bump(exactDefeatWins, p.userName)
      }
    }
  }

  if (!hasEvaluated) {
    // Todavía no se jugó nada evaluable: sin datos curiosos.
    return emptyFacts
  }

  // Selecciones con más plenos.
  const mostExactByTeam: TeamValue[] = [...exactByTeam.entries()]
    .map(([name, value]) => ({ name, flagUrl: teamFlag.get(name), value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 8)

  // Reyes del empate / empate exacto (top 5).
  const toUserRanking = (map: Map<string, number>): UserValue[] =>
    [...map.entries()]
      .map(([userName, value]) => ({ userName, value }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value || a.userName.localeCompare(b.userName))
      .slice(0, 5)

  // Partido récord: el de más plenos y el de más fallos.
  const toRecordMatch = (
    map: Map<number, number>
  ): RecordMatchFact | null => {
    let best: { num: number; count: number } | null = null
    for (const [num, count] of map) {
      if (!best || count > best.count) best = { num, count }
    }
    if (!best) return null
    const info = matchByNum.get(best.num)
    if (!info) return null
    return {
      team1: info.team1,
      team2: info.team2,
      team1FlagUrl: info.team1FlagUrl,
      team2FlagUrl: info.team2FlagUrl,
      homeScore: (info.homeScore as number) ?? 0,
      awayScore: (info.awayScore as number) ?? 0,
      round: info.round,
      count: best.count,
    }
  }

  // Goleadores del prode (mínimo 5 partidos cargados para que el promedio
  // sea representativo).
  const scorerRows = [...goalsByUser.entries()]
    .filter(([, g]) => g.count >= 5)
    .map(([userName, g]) => ({ userName, avg: g.total / g.count }))
    .sort((a, b) => b.avg - a.avg)

  return {
    hasData: true,
    favouriteTeamByUser: topPerUser(pointsByUserTeam, teamFlag),
    jinxTeamByUser: topPerUser(missByUserTeam, teamFlag),
    mostExactByTeam,
    drawKings: toUserRanking(drawsCorrect),
    exactDrawKings: toUserRanking(drawsExact),
    victoryKings: toUserRanking(decisiveCorrect),
    defeatKings: toUserRanking(decisiveMissed),
    exactVictoryKings: toUserRanking(exactVictoryWins),
    exactDefeatKings: toUserRanking(exactDefeatWins),
    mostAccuratedMatch: toRecordMatch(exactPerMatch),
    cursedMatch: toRecordMatch(missPerMatch),
    topScorer: scorerRows[0] ?? null,
    bottomScorer:
      scorerRows.length > 1 ? scorerRows[scorerRows.length - 1] : null,
  }
}
