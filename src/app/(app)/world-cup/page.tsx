export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSettings } from "@/server/db/queries"
import { getUser } from "@/lib/dal"
import { WcApiCheck } from "./wc-api-check"
import fixtureData from "../../../../specs/FIFA-WORLD-CUP/2026.json"
import { InfoIcon } from "lucide-react"
import { Alert } from "@/components/ui/alert"

interface WCMatch {
  round: string
  date: string
  time: string
  team1: string
  team2: string
  group?: string
  ground: string
}

// Parses "13:00 UTC-6" → UTC ISO string for the given date
function toUtcIso(date: string, time: string): string {
  const m = time.match(/(\d+):(\d+)\s+UTC([+-]\d+)/)
  if (!m) return `${date}T00:00:00Z`
  const utcHours = parseInt(m[1]) - parseInt(m[3])
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCHours(utcHours, parseInt(m[2]), 0, 0)
  return d.toISOString()
}

function formatMatchDate(isoDate: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(isoDate))
}

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

export default async function WorldCupPage() {
  const user = await getUser()
  const settings = await getSettings(user.id)
  const timezone = settings?.timezone ?? "UTC"

  const groupMatches = (fixtureData.matches as WCMatch[]).filter((m) => m.group)

  const grouped = groupMatches.reduce<Record<string, WCMatch[]>>((acc, m) => {
    const key = m.group!
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const sortedGroups = Object.keys(grouped).sort()

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
        FIFA World Cup 2026 — Group Stage
      </h1>
      <h2 className="text-[12px] font-medium text-muted-foreground">
        <Alert className="inline-flex items-center gap-3 text-yellow-500"><InfoIcon className="size-4" /> Football Data API aun no cuenta con datos de la Copa del Mundo 2026.</Alert>
      </h2>
      <hr />
      {user.role === "admin" && <WcApiCheck />}
      <h5 className="text-sm font-medium text-muted-foreground italic"> Momentaneamente se están usando datos de un archivo estático con los datos actualizados al <span className="font-bold text-primary">29/03/2026</span>.</h5>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sortedGroups.map((group) => (
          <Card key={group}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{group}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {grouped[group].map((match, i) => (
                <MatchRow key={i} match={match} timezone={timezone} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
