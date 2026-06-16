export const dynamic = "force-dynamic"

import Image from "next/image"
import {
  getUserPredictions,
  getProdeLeaderboardDetailed,
} from "@/server/db/queries"
import { getUser } from "@/lib/dal"
import { WcTabs } from "./wc-tabs"
import { GroupStandings } from "./group-standings"
import { GroupsTab } from "./groups-tab"
import { KnockoutBracket } from "./knockout-bracket"
import {
  extractGroupStandings,
  buildBracketRounds,
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
import type { WCMatch } from "./types"
import { PredictionsList } from "./prode/predictions-list"
import { Leaderboard } from "./prode/leaderboard"
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
  const [standings, apiGroupMatches, allMatches, userPredictions, leaderboard] =
    await Promise.all([
      fetchWCStandings(),
      fetchWCGroupMatches(),
      fetchAllWCMatches(),
      getUserPredictions(user.id),
      getProdeLeaderboardDetailed(),
    ])

  // Bracket from knockout matches returned by the API
  const bracketRounds = buildBracketRounds(allMatches)

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
    <div className="flex flex-col-reverse gap-4 lg:grid lg:grid-cols-3">
      <div className="mb-2 lg:col-span-3">
        <Alert>
          <Trophy className="size-4" />
          <AlertTitle>Pozo de premios - Pendiente</AlertTitle>
          <AlertDescription>
            Aun no se decidió que premios se repartirán entre los participantes.
            La idea será que los ganadores sean los 3 primeros puestos.
          </AlertDescription>
        </Alert>
      </div>
      <div className="lg:col-span-2">
        <PredictionsList
          matches={allMatches}
          initialPredictions={userPredictions}
          currentUserId={user.id}
        />
      </div>
      <div className="flex flex-col gap-4">
        {/* Reserva el alto del toggle Pendientes/Todos para alinear el Ranking
            con la primera tarjeta de partidos en pantallas grandes */}
        <div
          aria-hidden
          className="invisible hidden items-center gap-1 self-start rounded-md border p-0.5 lg:flex"
        >
          <span className="px-2.5 py-1 text-xs">Pendientes</span>
        </div>
        <Leaderboard
          entries={leaderboard}
          currentUserId={user.id}
          isAdmin={user.role === "admin"}
        />
      </div>
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
      />
    </div>
  )
}
