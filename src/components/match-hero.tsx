import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { TeamKey } from "@/lib/football-data"
import { TEAM_META } from "@/lib/teams"
import { formatMatchDate } from "@/lib/utils"
import type { Match } from "@/server/db/schema"

import { Countdown } from "./countdown"

interface MatchHeroProps {
  match: Match
  timezone: string
}

export function MatchHero({ match, timezone }: MatchHeroProps) {
  const team = TEAM_META[match.teamKey as TeamKey]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {match.competitionLogo && (
            <Image
              src={match.competitionLogo}
              alt={match.competition}
              width={20}
              height={20}
              className="object-contain"
            />
          )}
          <span className="text-sm text-muted-foreground">{match.competition}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {match.isHome ? "Home" : "Away"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16">
              <Image
                src={team.crestUrl}
                alt={team.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-medium">{team.shortName}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-muted-foreground">vs</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            {match.opponentLogo && (
              <div className="relative h-16 w-16">
                <Image
                  src={match.opponentLogo}
                  alt={match.opponent}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span className="text-sm font-medium">{match.opponent}</span>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t pt-4 text-sm text-muted-foreground">
          <p>{formatMatchDate(match.matchDate, timezone)}</p>
          {match.venue && <p>{match.venue}</p>}
          <p className="font-medium text-foreground">
            <Countdown matchDate={match.matchDate} />
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
