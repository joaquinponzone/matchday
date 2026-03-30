export const dynamic = "force-dynamic"

import Image from "next/image"
import { getSettings } from "@/server/db/queries"
import { getUser } from "@/lib/dal"
import { WcTabs } from "./wc-tabs"
import { GroupStandings } from "./group-standings"
import { KnockoutBracket } from "./knockout-bracket"
import {
  extractGroupStandings,
  buildBracketRounds,
  toUtcIso,
  formatMatchDate,
} from "./lib"
import { fetchWCStandings, fetchWCGroupMatches } from "@/lib/fifa"
import fixtureData from "../../../../specs/FIFA-WORLD-CUP/2026.json"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WCMatch } from "./types"

function MatchRow({ match, timezone }: { match: WCMatch; timezone: string }) {
  const utcDate = toUtcIso(match.date, match.time)

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
      <span className="flex-1 flex items-center justify-end gap-1.5 truncate">
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
      <span className="text-muted-foreground text-center w-24 shrink-0 font-mono text-[10px]">
        {formatMatchDate(utcDate, timezone)}
      </span>
      <span className="flex-1 flex items-center gap-1.5 truncate">
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
  timezone,
}: {
  groupedMatches: Record<string, WCMatch[]>
  sortedGroups: string[]
  timezone: string
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
              <MatchRow key={i} match={match} timezone={timezone} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function WorldCupPage() {
  const user = await getUser()
  const settings = await getSettings(user.id)
  const timezone = settings?.timezone ?? "UTC"

  // Static data for bracket (FIFA API doesn't have knockout structure yet)
  const allStaticMatches = fixtureData.matches as WCMatch[]
  const bracketRounds = buildBracketRounds(allStaticMatches)

  // Live data from FIFA API
  const [standings, apiGroupMatches] = await Promise.all([
    fetchWCStandings(),
    fetchWCGroupMatches(),
  ])

  // Fallback to static data if API fails
  const groupMatches =
    apiGroupMatches.length > 0
      ? apiGroupMatches
      : allStaticMatches.filter((m) => m.group)
  const activeStandings =
    standings.length > 0 ? standings : extractGroupStandings(allStaticMatches)

  const groupedMatches = groupMatches.reduce<Record<string, WCMatch[]>>(
    (acc, m) => {
      const key = m.group!
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {},
  )
  const sortedGroups = Object.keys(groupedMatches).sort()

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
        FIFA World Cup 2026
      </h1>
      <WcTabs
        standingsContent={<GroupStandings standings={activeStandings} />}
        matchesContent={
          <MatchesView
            groupedMatches={groupedMatches}
            sortedGroups={sortedGroups}
            timezone={timezone}
          />
        }
        bracketContent={
          <KnockoutBracket rounds={bracketRounds} timezone={timezone} />
        }
      />
    </div>
  )
}
