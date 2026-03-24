import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { TeamKey } from "@/lib/football-data"
import { TEAM_META } from "@/lib/teams"
import { formatMatchDate } from "@/lib/utils"
import type { Match } from "@/server/db/schema"

interface MatchCardProps {
  match: Match
  timezone: string
}

export function MatchCard({ match, timezone }: MatchCardProps) {
  const team = TEAM_META[match.teamKey as TeamKey]

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Image
          src={team.crestUrl}
          alt={team.name}
          width={16}
          height={16}
          className="shrink-0 object-contain"
        />
        {match.opponentLogo && (
          <Image
            src={match.opponentLogo}
            alt={match.opponent}
            width={32}
            height={32}
            className="object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{team.shortName} vs {match.opponent}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatMatchDate(match.matchDate, timezone)}
          </p>
          <p className="text-xs text-muted-foreground">{match.competition}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {match.isHome ? "H" : "A"}
        </Badge>
      </CardContent>
    </Card>
  )
}
