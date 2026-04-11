"use client"

import { useState, useTransition, type KeyboardEvent } from "react"
import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WCMatch } from "../types"
import type { ProdePrediction } from "@/server/db/schema"
import { savePrediction } from "./actions"
import { toUtcIso } from "../lib"

interface PredictionsListProps {
  matches: WCMatch[]
  initialPredictions: ProdePrediction[]
}

function isLocked(match: WCMatch): boolean {
  return new Date() >= new Date(toUtcIso(match.date, match.time))
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

const GOAL_MAX = 99

function clampGoal(n: number): number {
  return Math.max(0, Math.min(GOAL_MAX, n))
}

function GoalStepper({
  value,
  onChange,
  teamName,
}: {
  value: number
  onChange: (value: number) => void
  teamName: string
}) {
  const dec = () => onChange(clampGoal(value - 1))
  const inc = () => onChange(clampGoal(value + 1))

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault()
      inc()
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault()
      dec()
    }
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded border border-border bg-background/80 p-0.5"
      role="group"
      aria-label={`Goles ${teamName}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={`Restar gol a ${teamName}`}
        disabled={value <= 0}
        onClick={dec}
      >
        <Minus data-icon="inline-start" />
      </Button>
      <span
        className="min-w-6 text-center text-sm font-mono tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={`Sumar gol a ${teamName}`}
        disabled={value >= GOAL_MAX}
        onClick={inc}
      >
        <Plus data-icon="inline-start" />
      </Button>
    </div>
  )
}

function MatchPredictionRow({
  match,
  prediction,
}: {
  match: WCMatch
  prediction: ProdePrediction | undefined
}) {
  const locked = isLocked(match)
  const initialHome = prediction?.homeScore ?? 0
  const initialAway = prediction?.awayScore ?? 0
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  const [lastSavedHome, setLastSavedHome] = useState(initialHome)
  const [lastSavedAway, setLastSavedAway] = useState(initialAway)
  const [saved, setSaved] = useState(!!prediction)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const h = clampGoal(home)
    const a = clampGoal(away)
    setHome(h)
    setAway(a)
    setError(null)
    startTransition(async () => {
      const res = await savePrediction(match.num!, h, a)
      if (res?.error) {
        setError(res.error)
      } else {
        setLastSavedHome(h)
        setLastSavedAway(a)
        setSaved(true)
      }
    })
  }

  const dirty = home !== lastSavedHome || away !== lastSavedAway

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs">
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

      {/* Score steppers or locked display */}
      <div className="flex items-center gap-1 shrink-0">
        {locked ? (
          <span className="font-mono text-sm text-muted-foreground w-14 text-center">
            {prediction != null
              ? `${prediction.homeScore} - ${prediction.awayScore}`
              : "— - —"}
          </span>
        ) : (
          <>
            <GoalStepper
              value={home}
              teamName={match.team1}
              onChange={(v) => {
                setHome(v)
                setSaved(false)
              }}
            />
            <span className="text-muted-foreground px-0.5">-</span>
            <GoalStepper
              value={away}
              teamName={match.team2}
              onChange={(v) => {
                setAway(v)
                setSaved(false)
              }}
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
      </div>
      {error && (
        <div className="px-3 pb-2 text-[10px] text-destructive">{error}</div>
      )}
    </div>
  )
}

export function PredictionsList({ matches, initialPredictions }: PredictionsListProps) {
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
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
