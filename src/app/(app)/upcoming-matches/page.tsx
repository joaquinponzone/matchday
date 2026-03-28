export const dynamic = "force-dynamic"

import { MatchCard } from "@/components/match-card"
import { RefreshButton } from "@/components/refresh-button"
import { verifySession } from "@/lib/dal"
import { getSettings, getUpcomingMatches } from "@/server/db/queries"

export default async function UpcomingMatchesPage() {
  const { userId } = await verifySession()
  const [settings, matches] = await Promise.all([
    getSettings(userId),
    getUpcomingMatches(5),
  ])
  const timezone = settings?.timezone ?? "UTC"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-muted-foreground">Upcoming matches</h1>
        <RefreshButton />
      </div>
      {matches.length === 0 ? (
        <p className="text-muted-foreground">No upcoming matches scheduled.</p>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} timezone={timezone} />
          ))}
        </div>
      )}
    </div>
  )
}
