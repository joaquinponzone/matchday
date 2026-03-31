import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatMatchDateParts } from "@/lib/utils"
import type { Match } from "@/server/db/schema"

interface MatchCardProps {
  match: Match
  timezone: string
}

export function MatchCard({ match, timezone }: MatchCardProps) {
  const teamName = match.teamShortName ?? match.teamKey
  const teamCrest = match.teamCrest

  const homeName = match.isHome ? teamName : match.opponent
  const awayName = match.isHome ? match.opponent : teamName
  const homeCrest = match.isHome ? teamCrest : match.opponentLogo
  const awayCrest = match.isHome ? match.opponentLogo : teamCrest
  const { date, time } = formatMatchDateParts(match.matchDate, timezone)

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2 bg-muted p-4">
          {homeCrest && (
            <Image
              src={homeCrest}
              alt={homeName}
              width={32}
              height={32}
              className="shrink-0 object-contain"
            />
          )}
          -
          {awayCrest && (
            <Image
              src={awayCrest}
              alt={awayName}
              width={32}
              height={32}
              className="object-contain"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{homeName} vs {awayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="md:hidden">{time}</span>
            <span className="hidden md:inline">{time} - {date}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground md:hidden">
            {date}
          </p>
          <p className="text-xs text-muted-foreground">{match.competition}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {match.isHome ? "L" : "V"}
        </Badge>
      </CardContent>
    </Card>
  )
}
