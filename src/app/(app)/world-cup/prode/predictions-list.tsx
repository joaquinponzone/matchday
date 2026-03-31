"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WCMatch } from "../types"
import type { ProdePrediction } from "@/server/db/schema"
import { savePrediction } from "./actions"
import { toUtcIso } from "../lib"

interface PredictionsListProps {
  matches: WCMatch[]
  initialPredictions: ProdePrediction[]
  timezone: string
}

function isLocked(match: WCMatch): boolean {
  return new Date() >= new Date(toUtcIso(match.date, match.time))
}

function formatMatchDate(match: WCMatch, timezone: string): string {
  const iso = toUtcIso(match.date, match.time)
  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso))
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-mono shrink-0",
        points === 3 && "border-green-500 text-green-500",
        points === 1 && "border-yellow-500 text-yellow-500",
        points === 0 && "border-muted-foreground text-muted-foreground",
      )}
    >
      {points === 3 ? "+3" : points === 1 ? "+1" : "0"}
    </Badge>
  )
}

function MatchPredictionRow({
  match,
  prediction,
  timezone,
}: {
  match: WCMatch
  prediction: ProdePrediction | undefined
  timezone: string
}) {
  const locked = isLocked(match)
  const [home, setHome] = useState(prediction?.homeScore?.toString() ?? "")
  const [away, setAway] = useState(prediction?.awayScore?.toString() ?? "")
  const [saved, setSaved] = useState(!!prediction)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Ingresá un marcador válido")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await savePrediction(match.num!, h, a)
      if (res?.error) {
        setError(res.error)
      } else {
        setSaved(true)
      }
    })
  }

  const dirty =
    home !== (prediction?.homeScore?.toString() ?? "") ||
    away !== (prediction?.awayScore?.toString() ?? "")

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b last:border-0 text-xs">
      {/* Team 1 */}
      <span className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="truncate text-right">{match.team1}</span>
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

      {/* Score inputs or locked display */}
      <div className="flex items-center gap-1 shrink-0">
        {locked ? (
          <span className="font-mono text-sm text-muted-foreground w-14 text-center">
            {prediction != null
              ? `${prediction.homeScore} - ${prediction.awayScore}`
              : "— - —"}
          </span>
        ) : (
          <>
            <input
              type="number"
              min={0}
              max={99}
              value={home}
              onChange={(e) => { setHome(e.target.value); setSaved(false) }}
              className="w-8 h-7 text-center text-sm font-mono bg-background border rounded focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              min={0}
              max={99}
              value={away}
              onChange={(e) => { setAway(e.target.value); setSaved(false) }}
              className="w-8 h-7 text-center text-sm font-mono bg-background border rounded focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </>
        )}
      </div>

      {/* Team 2 */}
      <span className="flex-1 flex items-center gap-1.5 min-w-0">
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

      {/* Right side: save button or points badge */}
      <div className="shrink-0 w-12 flex justify-end">
        {!locked && (
          <button
            onClick={handleSave}
            disabled={isPending || (!dirty && saved)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
              saved && !dirty
                ? "border-green-500/40 text-green-500/70 cursor-default"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              isPending && "opacity-50 cursor-not-allowed",
            )}
          >
            {isPending ? "..." : saved && !dirty ? "✓" : "Guardar"}
          </button>
        )}
        {locked && <PointsBadge points={prediction?.points ?? null} />}
      </div>

      {error && (
        <span className="absolute text-[10px] text-destructive">{error}</span>
      )}
    </div>
  )
}

export function PredictionsList({ matches, initialPredictions, timezone }: PredictionsListProps) {
  const predByMatch = new Map(initialPredictions.map((p) => [p.matchNumber, p]))

  // Group matches by round
  const rounds: Record<string, WCMatch[]> = {}
  for (const m of matches) {
    if (!m.num) continue
    const key = m.round || "Otros"
    if (!rounds[key]) rounds[key] = []
    rounds[key].push(m)
  }

  const sortedRounds = Object.entries(rounds).sort(([, a], [, b]) => {
    const dateA = new Date(toUtcIso(a[0].date, a[0].time))
    const dateB = new Date(toUtcIso(b[0].date, b[0].time))
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {sortedRounds.map(([round, roundMatches]) => (
        <Card key={round}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{round}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {roundMatches.map((match) => (
              <MatchPredictionRow
                key={match.num}
                match={match}
                prediction={predByMatch.get(match.num!)}
                timezone={timezone}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
