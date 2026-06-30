"use client"

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookText, Minus, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, isToday, formatMatchTimeOnly } from "@/lib/utils"
import type { WCMatch } from "../types"
import type { ProdePrediction } from "@/server/db/schema"
import { savePrediction } from "./actions"
import { MatchPredictionsDialog } from "./match-predictions-dialog"
import {
  dayLabel,
  groupMatchesByDay,
  isKnockout,
  pickTodayOrNearestDay,
  toUtcIso,
} from "../lib"

interface PredictionsListProps {
  matches: WCMatch[]
  initialPredictions: ProdePrediction[]
  currentUserId: number
  leaderboard: ReactNode
}

export function isLocked(match: WCMatch): boolean {
  return new Date() >= new Date(toUtcIso(match.date, match.time))
}

export function isFinished(match: WCMatch): boolean {
  return (
    match.finished === true &&
    match.homeScore != null &&
    match.awayScore != null
  )
}

// In progress: kickoff has passed, not finished yet, but a live score exists.
export function isLive(match: WCMatch): boolean {
  return (
    isLocked(match) &&
    !isFinished(match) &&
    match.homeScore != null &&
    match.awayScore != null
  )
}

export function LiveBadge({ minute }: { minute?: string | null }) {
  return (
    <Badge
      variant="outline"
      title="Partido en juego"
      className="shrink-0 gap-1 border-red-500/50 px-1 font-mono text-[9px] text-red-500"
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
      </span>
      EN VIVO
      {minute && <span className="tabular-nums">{minute}</span>}
    </Badge>
  )
}

export function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return null
  return (
    <Badge
      variant="outline"
      title="Puntos que sumaste en este partido"
      className={cn(
        "shrink-0 gap-0.5 font-mono text-[10px]",
        points >= 3 && "border-emerald-400 text-emerald-400",
        points === 2 && "border-green-500 text-green-500",
        points === 1 && "border-yellow-500 text-yellow-500",
        points === 0 && "border-muted-foreground text-muted-foreground"
      )}
    >
      {points > 0 ? `+${points}` : "0"}
      <span className="opacity-60">pts</span>
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
        className="min-w-6 text-center font-mono text-sm tabular-nums"
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
  currentUserId,
}: {
  match: WCMatch
  prediction: ProdePrediction | undefined
  currentUserId: number
}) {
  const locked = isLocked(match)
  const finished = isFinished(match)
  const live = isLive(match)
  // Fase de llave con equipos ya definidos (no placeholders): se puede predecir
  // quién pasa. Las banderas solo existen para equipos reales.
  const knockout =
    isKnockout(match.num!) && !!match.team1FlagUrl && !!match.team2FlagUrl
  const initialHome = prediction?.homeScore ?? 0
  const initialAway = prediction?.awayScore ?? 0
  const initialAdvancing =
    (prediction?.advancingTeam as "home" | "away" | null | undefined) ?? null
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  const [advancing, setAdvancing] = useState<"home" | "away" | null>(
    initialAdvancing
  )
  const [lastSavedHome, setLastSavedHome] = useState(initialHome)
  const [lastSavedAway, setLastSavedAway] = useState(initialAway)
  const [lastSavedAdvancing, setLastSavedAdvancing] = useState<
    "home" | "away" | null
  >(initialAdvancing)
  const [saved, setSaved] = useState(!!prediction)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // El pick de "quién pasa" solo aplica si predecís empate. En un no-empate, el
  // clasificado queda implícito en el marcador (el que gana), así que no se guarda.
  const isDraw = home === away
  const effectiveAdvancing = isDraw ? advancing : null

  const handleSave = () => {
    const h = clampGoal(home)
    const a = clampGoal(away)
    const adv = h === a ? advancing : null
    setHome(h)
    setAway(a)
    setError(null)
    startTransition(async () => {
      const res = await savePrediction(match.num!, h, a, adv)
      if (res?.error) {
        setError(res.error)
      } else {
        setLastSavedHome(h)
        setLastSavedAway(a)
        setLastSavedAdvancing(adv)
        setSaved(true)
      }
    })
  }

  const dirty =
    home !== lastSavedHome ||
    away !== lastSavedAway ||
    effectiveAdvancing !== lastSavedAdvancing
  const kickoff = formatMatchTimeOnly(toUtcIso(match.date, match.time))

  // Score steppers, real result, or locked prediction display — shared between
  // the mobile (stacked) and desktop (inline) layouts.
  const scoreArea = (
    <div className="flex shrink-0 items-center gap-1">
      {finished || live ? (
        <span className="flex w-14 flex-col items-center">
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              live && "text-red-500"
            )}
          >
            {match.homeScore} - {match.awayScore}
          </span>
          {prediction != null && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {prediction.homeScore}-{prediction.awayScore}
            </span>
          )}
        </span>
      ) : locked ? (
        <span className="w-14 text-center font-mono text-sm text-muted-foreground">
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
          <span className="px-0.5 text-muted-foreground">-</span>
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
  )

  // Save button or points/live badge — shared between layouts.
  const actionArea = !locked ? (
    <button
      onClick={handleSave}
      disabled={isPending || (!dirty && saved)}
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
        saved && !dirty
          ? "cursor-default border-green-500/40 text-green-500/70"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
        isPending && "cursor-not-allowed opacity-50"
      )}
    >
      {isPending ? "..." : saved && !dirty ? "✓" : "Guardar"}
    </button>
  ) : (
    <div className="flex items-center gap-1.5">
      {live ? (
        <LiveBadge minute={match.matchTime} />
      ) : (
        <PointsBadge
          points={
            prediction?.points == null
              ? null
              : prediction.points + (prediction.bonus ?? 0)
          }
        />
      )}
      <MatchPredictionsDialog match={match} currentUserId={currentUserId} />
    </div>
  )

  // Pick de "quién pasa" — solo en partidos de llave con equipos definidos y
  // cuando predecís empate. Si se define por penales, acertar el clasificado
  // suma +1. En un no-empate el clasificado se infiere del marcador.
  const advancesArea =
    !knockout || !isDraw || (locked && advancing == null) ? null : (
      <div className="flex items-center gap-1 text-[10px]">
        <span className="text-muted-foreground">Predicción en caso de empate:</span>
        {(["home", "away"] as const).map((side) => {
          const teamName = side === "home" ? match.team1 : match.team2
          const selected = advancing === side
          if (locked) {
            return selected ? (
              <span
                key={side}
                className="rounded border border-primary/50 px-1.5 py-0.5 font-medium text-primary"
              >
                {teamName}
              </span>
            ) : null
          }
          return (
            <button
              key={side}
              type="button"
              onClick={() => {
                setAdvancing(side)
                setSaved(false)
              }}
              className={cn(
                "rounded border px-1.5 py-0.5 transition-colors",
                selected
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {teamName}
            </button>
          )
        })}
      </div>
    )

  return (
    <div className="border-b last:border-0">
      {/* Desktop layout: time | team1 | score | team2 | action */}
      <div className="hidden items-center gap-2 px-3 py-2.5 text-xs sm:flex">
        <span className="w-10 shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {kickoff}
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
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
        {scoreArea}
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
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
        <div className="flex shrink-0 justify-end">{actionArea}</div>
      </div>

      {/* Mobile layout: teams flanking the kickoff time (like group matches),
          with score + action below */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 text-xs sm:hidden">
        <div className="flex items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <span className="truncate text-right">{match.team1}</span>
            {match.team1FlagUrl && (
              <Image
                src={match.team1FlagUrl}
                alt={match.team1}
                width={20}
                height={20}
                className="shrink-0 rounded-sm"
                unoptimized
              />
            )}
          </span>
          <span className="w-12 shrink-0 text-center text-[10px] text-muted-foreground tabular-nums">
            {kickoff}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            {match.team2FlagUrl && (
              <Image
                src={match.team2FlagUrl}
                alt={match.team2}
                width={20}
                height={20}
                className="shrink-0 rounded-sm"
                unoptimized
              />
            )}
            <span className="truncate">{match.team2}</span>
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span aria-hidden />
          <div className="flex justify-center">{scoreArea}</div>
          <div className="flex justify-end">{actionArea}</div>
        </div>
      </div>

      {advancesArea && (
        <div className="flex justify-center px-3 pb-2">{advancesArea}</div>
      )}

      {error && (
        <div className="px-3 pb-2 text-[10px] text-destructive">{error}</div>
      )}
    </div>
  )
}

export function PredictionsList({
  matches,
  initialPredictions,
  currentUserId,
  leaderboard,
}: PredictionsListProps) {
  const predByMatch = new Map(initialPredictions.map((p) => [p.matchNumber, p]))
  const todayRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<"today" | "pending" | "all">("today")
  const todayMode = filter === "today"
  const router = useRouter()

  // Bring today's matchday into view when the tab opens or the filter changes
  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: "start" })
  }, [filter])

  const validMatches = matches.filter((m) => m.num != null)
  const hasLive = validMatches.some(isLive)

  // Mientras haya un partido en juego, refrescamos los datos del servidor cada
  // 60s para que el minuto y el marcador en vivo avancen solos.
  useEffect(() => {
    if (!hasLive) return
    const id = setInterval(() => router.refresh(), 60000)
    return () => clearInterval(id)
  }, [hasLive, router])

  const sortedDays =
    filter === "today"
      ? pickTodayOrNearestDay(groupMatchesByDay(validMatches))
      : filter === "pending"
        ? groupMatchesByDay(validMatches.filter((m) => !isFinished(m)))
        : groupMatchesByDay(validMatches)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {(["today", "pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs transition-colors",
                filter === f
                  ? "bg-foreground font-medium text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "today" ? "Hoy" : f === "pending" ? "Pendientes" : "Todos"}
            </button>
          ))}
        </div>
        <Link
          href="/world-cup/prode/reglamento"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <BookText className="size-3.5" />
          Reglamento
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            todayMode ? "2xl:grid-cols-1" : "2xl:col-span-2 2xl:grid-cols-2"
          )}
        >
          {sortedDays.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {filter === "today"
                ? "No hay partidos próximos."
                : filter === "pending"
                  ? "No hay partidos pendientes."
                  : "No hay partidos."}
            </p>
          ) : (
            sortedDays.map(({ key, iso, matches: dayMatches }) => {
              const today = isToday(iso)
              return (
                <Card
                  key={key}
                  ref={today ? todayRef : undefined}
                  className={cn("scroll-mt-4", today && "border-primary")}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span className={cn(today && "text-primary")}>
                        {dayLabel(iso)}
                      </span>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {dayMatches.length}{" "}
                        {dayMatches.length === 1 ? "partido" : "partidos"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {dayMatches.map((match) => (
                      <MatchPredictionRow
                        key={match.num}
                        match={match}
                        prediction={predByMatch.get(match.num!)}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
        <div className={cn(todayMode && "lb-wide 2xl:col-span-2")}>
          {leaderboard}
        </div>
      </div>
    </div>
  )
}
