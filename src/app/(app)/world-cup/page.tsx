export const dynamic = "force-dynamic"

import { getSettings } from "@/server/db/queries"
import { getUser } from "@/lib/dal"
import { WcApiCheck } from "./wc-api-check"
import { WcTabs } from "./wc-tabs"
import { GroupStandings } from "./group-standings"
import { KnockoutBracket } from "./knockout-bracket"
import {
  extractGroupStandings,
  buildBracketRounds,
  toUtcIso,
  formatMatchDate,
} from "./lib"
import fixtureData from "../../../../specs/FIFA-WORLD-CUP/2026.json"
import { InfoIcon } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WCMatch } from "./types"

function MatchRow({ match, timezone }: { match: WCMatch; timezone: string }) {
  const utcDate = toUtcIso(match.date, match.time)

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
      <span className="flex-1 text-right truncate">{match.team1}</span>
      <span className="text-muted-foreground text-center w-24 shrink-0 font-mono text-[10px]">
        {formatMatchDate(utcDate, timezone)}
      </span>
      <span className="flex-1 truncate">{match.team2}</span>
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

  const allMatches = fixtureData.matches as WCMatch[]

  // Group stage matches view
  const groupMatches = allMatches.filter((m) => m.group)
  const groupedMatches = groupMatches.reduce<Record<string, WCMatch[]>>((acc, m) => {
    const key = m.group!
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})
  const sortedGroups = Object.keys(groupedMatches).sort()

  // Standings
  const standings = extractGroupStandings(allMatches)

  // Bracket
  const bracketRounds = buildBracketRounds(allMatches)

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
        FIFA World Cup 2026
      </h1>
      <Alert className="inline-flex items-center gap-3 text-yellow-500 text-[12px]">
        <InfoIcon className="size-4 shrink-0" />
        Football Data API aun no cuenta con datos de la Copa del Mundo 2026.
      </Alert>
      {user.role === "admin" && <WcApiCheck />}
      <p className="text-[11px] text-muted-foreground italic">
        Datos estáticos actualizados al{" "}
        <span className="font-bold text-primary">29/03/2026</span>.
      </p>
      <WcTabs
        standingsContent={<GroupStandings standings={standings} />}
        matchesContent={
          <MatchesView
            groupedMatches={groupedMatches}
            sortedGroups={sortedGroups}
            timezone={timezone}
          />
        }
        bracketContent={<KnockoutBracket rounds={bracketRounds} timezone={timezone} />}
      />
    </div>
  )
}
