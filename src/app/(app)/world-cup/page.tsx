export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Image from "next/image"
import {
  getUserPredictions,
  getProdeLeaderboardDetailed,
  getAllProdePredictions,
} from "@/server/db/queries"
import { getUser } from "@/lib/dal"
import { WcTabs } from "./wc-tabs"
import { WcTabsProvider } from "./wc-tabs-context"
import { GroupStandings } from "./group-standings"
import { GroupsTab } from "./groups-tab"
import { KnockoutBracket } from "./knockout-bracket"
import { StatisticsTab } from "./statistics-tab"
import { TeamStatistics } from "./team-statistics"
import {
  PlayerStatisticsSection,
  PlayerStatisticsFallback,
} from "./player-statistics"
import {
  extractGroupStandings,
  buildBracketRounds,
  computeTournamentStats,
  toUtcIso,
  formatMatchDate,
} from "./lib"
import {
  fetchWCStandings,
  fetchWCGroupMatches,
  fetchAllWCMatches,
} from "@/lib/fifa"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Trophy } from "lucide-react"
import type { WCMatch, FairPlayTeam } from "./types"
import { PredictionsList } from "./prode/predictions-list"
import { Leaderboard } from "./prode/leaderboard"
import { computeProdeFunFacts } from "./prode/fun-facts"
import { FunFactsSection } from "./prode/fun-facts-section"
import { WorldCupCountdown } from "./countdown"

function MatchRow({ match }: { match: WCMatch }) {
  const utcDate = toUtcIso(match.date, match.time)

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2 text-xs last:border-0">
      <span className="flex flex-1 items-center justify-end gap-1.5 truncate">
        <span className="truncate">{match.team1}</span>
        {match.team1FlagUrl && (
          <Image
            src={match.team1FlagUrl}
            alt={match.team1}
            width={16}
            height={16}
            className="shrink-0 rounded-sm"
            unoptimized
          />
        )}
      </span>
      <span className="w-24 shrink-0 text-center font-mono">
        {match.finished &&
        match.homeScore != null &&
        match.awayScore != null ? (
          <span className="text-sm font-semibold tabular-nums">
            {match.homeScore} - {match.awayScore}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {formatMatchDate(utcDate)}
          </span>
        )}
      </span>
      <span className="flex flex-1 items-center gap-1.5 truncate">
        {match.team2FlagUrl && (
          <Image
            src={match.team2FlagUrl}
            alt={match.team2}
            width={16}
            height={16}
            className="shrink-0 rounded-sm"
            unoptimized
          />
        )}
        <span className="truncate">{match.team2}</span>
      </span>
    </div>
  )
}

function MatchesView({
  groupedMatches,
  sortedGroups,
}: {
  groupedMatches: Record<string, WCMatch[]>
  sortedGroups: string[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {sortedGroups.map((group) => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{group}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupedMatches[group].map((match, i) => (
              <MatchRow key={i} match={match} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function WorldCupPage() {
  const user = await getUser()

  // Live data from FIFA API + prode data
  const [
    standings,
    apiGroupMatches,
    allMatches,
    userPredictions,
    allPredictions,
  ] = await Promise.all([
    fetchWCStandings(),
    fetchWCGroupMatches(),
    fetchAllWCMatches(),
    getUserPredictions(user.id),
    getAllProdePredictions(),
  ])

  // `allMatches` viene ordenado cronológicamente: lo usamos para que la racha
  // del leaderboard se calcule en el orden real de juego (el matchNumber de
  // FIFA no es cronológico).
  const leaderboard = await getProdeLeaderboardDetailed(
    allMatches.map((m) => m.num).filter((n): n is number => n !== undefined)
  )

  // Bracket from knockout matches returned by the API
  const bracketRounds = buildBracketRounds(allMatches)

  // Estadísticas del torneo computadas de los partidos finalizados + fair play
  // (TeamConductScore) que viene en el endpoint de standings.
  const tournamentStats = computeTournamentStats(allMatches)
  // Datos curiosos del prode: cruza las predicciones con los equipos de cada
  // partido (que viven en la API de FIFA, no en la DB).
  const funFacts = computeProdeFunFacts(allPredictions, allMatches)
  // `TeamStatistics` deriva su propio orden (más sancionados), así que acá solo
  // aplanamos las selecciones con conductScore disponible.
  const fairPlay: FairPlayTeam[] = standings
    .flatMap((s) => s.teams)
    .filter((t) => typeof t.conductScore === "number")
    .map((t) => ({
      name: t.name,
      flagUrl: t.flagUrl,
      conductScore: t.conductScore as number,
    }))

  const firstMatch = allMatches[0]
  const firstMatchDate = firstMatch
    ? toUtcIso(firstMatch.date, firstMatch.time)
    : null
  const firstMatchLabel = firstMatch
    ? `${firstMatch.team1} vs ${firstMatch.team2} · ${formatMatchDate(firstMatchDate!)}`
    : undefined

  // Fallback to empty standings extracted from group matches if API fails
  const groupMatches = apiGroupMatches.length > 0 ? apiGroupMatches : []
  const activeStandings =
    standings.length > 0 ? standings : extractGroupStandings(groupMatches)

  const groupedMatches = groupMatches.reduce<Record<string, WCMatch[]>>(
    (acc, m) => {
      const key = m.group!
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {}
  )
  const sortedGroups = Object.keys(groupedMatches).sort()

  const prodeContent = (
    <div className="flex flex-col-reverse gap-4 2xl:flex-col">
      {/* <Alert className="mb-2">
        <Trophy className="size-4" />
        <AlertTitle>Pozo de premios - Pendiente</AlertTitle>
        <AlertDescription>
          Aun no se decidió que premios se repartirán entre los participantes. La
          idea será que los ganadores sean los 3 primeros puestos.
        </AlertDescription>
      </Alert> */}
      <PredictionsList
        matches={allMatches}
        initialPredictions={userPredictions}
        currentUserId={user.id}
        leaderboard={
          <Leaderboard
            entries={leaderboard}
            currentUserId={user.id}
            isAdmin={user.role === "admin"}
          />
        }
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium md:text-2xl lg:text-3xl">
        FIFA World Cup 2026
      </h1>
      {firstMatchDate && (
        <WorldCupCountdown
          targetDate={firstMatchDate}
          firstMatchLabel={firstMatchLabel}
        />
      )}
      <WcTabsProvider>
        <WcTabs
          standingsContent={
            <GroupsTab
              standingsContent={<GroupStandings standings={activeStandings} />}
              matchesContent={
                <MatchesView
                  groupedMatches={groupedMatches}
                  sortedGroups={sortedGroups}
                />
              }
            />
          }
          bracketContent={<KnockoutBracket rounds={bracketRounds} />}
          prodeContent={prodeContent}
          statisticsContent={
            <StatisticsTab
              teamContent={
                <TeamStatistics stats={tournamentStats} fairPlay={fairPlay} />
              }
              playerContent={
                <Suspense fallback={<PlayerStatisticsFallback />}>
                  <PlayerStatisticsSection />
                </Suspense>
              }
              funFactsContent={<FunFactsSection facts={funFacts} />}
            />
          }
        />
      </WcTabsProvider>
    </div>
  )
}
