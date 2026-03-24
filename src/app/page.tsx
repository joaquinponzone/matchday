export const dynamic = "force-dynamic"

import { MatchCard } from "@/components/match-card"
import { MatchHero } from "@/components/match-hero"
import { getSettings, getUpcomingMatches } from "@/server/db/queries"

export default async function DashboardPage() {
  const [settings, upcoming] = await Promise.all([getSettings(), getUpcomingMatches(10)])

  const timezone = settings?.timezone ?? "UTC"
  const [hero, ...rest] = upcoming

  if (!hero) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">No upcoming matches scheduled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-muted-foreground">Next match</h1>
      <MatchHero match={hero} timezone={timezone} />

      {rest.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Coming up</h2>
          <div className="space-y-2">
            {rest.map((match) => (
              <MatchCard key={match.id} match={match} timezone={timezone} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
