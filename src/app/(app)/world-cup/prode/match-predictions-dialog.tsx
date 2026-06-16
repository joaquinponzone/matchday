"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn, formatMatchTimeOnly } from "@/lib/utils"
import type { WCMatch } from "../types"
import { toUtcIso } from "../lib"
import { getMatchPredictionsAction, type MatchPrediction } from "./actions"
import { PointsBadge, isFinished, isLive } from "./predictions-list"

function sortPredictions(
  predictions: MatchPrediction[],
  byPoints: boolean
): MatchPrediction[] {
  return [...predictions].sort((a, b) => {
    if (byPoints) {
      const diff = (b.points ?? 0) - (a.points ?? 0)
      if (diff !== 0) return diff
    }
    return a.userName.localeCompare(b.userName, "es")
  })
}

export function MatchPredictionsDialog({
  match,
  currentUserId,
}: {
  match: WCMatch
  currentUserId: number
}) {
  const [open, setOpen] = useState(false)
  const [predictions, setPredictions] = useState<MatchPrediction[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const finished = isFinished(match)
  const live = isLive(match)
  const hasScore = match.homeScore != null && match.awayScore != null

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    // Lazy-load once; predictions for a started match don't change.
    if (next && predictions === null && !isPending) {
      setError(null)
      startTransition(async () => {
        const res = await getMatchPredictionsAction(match.num!)
        if ("predictions" in res) {
          setPredictions(res.predictions)
        } else {
          setError(res.error)
        }
      })
    }
  }

  const sorted = predictions ? sortPredictions(predictions, finished) : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ver todas las predicciones"
              className="flex items-center justify-center rounded border border-border p-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Eye className="size-3.5" />
            </button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Ver todas las predicciones</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-sm">
            <span className="flex items-center gap-1.5">
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
              {match.team1}
            </span>
            <span className="text-muted-foreground">vs</span>
            <span className="flex items-center gap-1.5">
              {match.team2}
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
            </span>
          </DialogTitle>
          <DialogDescription className="text-center">
            {finished || live ? (
              <span
                className={cn(
                  "font-mono text-lg font-semibold text-foreground tabular-nums",
                  live && "text-red-500"
                )}
              >
                {match.homeScore} - {match.awayScore}
                {live && <span className="ml-1.5 text-[10px]">EN VIVO</span>}
              </span>
            ) : (
              <span>
                {hasScore
                  ? `${match.homeScore} - ${match.awayScore}`
                  : `Comenzó a las ${formatMatchTimeOnly(
                      toUtcIso(match.date, match.time)
                    )}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {error}
          </p>
        ) : sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nadie predijo este partido.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto">
            {sorted.map((p) => {
              const mine = p.userId === currentUserId
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm",
                    mine && "bg-primary/10"
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      {p.userName}
                      {mine && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (vos)
                        </span>
                      )}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {p.email}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {p.homeScore} - {p.awayScore}
                  </span>
                  {p.points !== null && (
                    <span className="flex shrink-0 justify-end">
                      <PointsBadge points={p.points} />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
