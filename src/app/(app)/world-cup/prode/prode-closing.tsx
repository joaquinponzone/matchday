import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Flag } from "../stat-flag"
import { FunFactsLink } from "./fun-facts-link"
import { StatInfo } from "./stat-info"
import type { LeaderboardEntry } from "./leaderboard"
import type { ProdeFunFacts, UserTeamFact } from "./fun-facts"

interface ProdeClosingProps {
  entries: LeaderboardEntry[]
  facts: ProdeFunFacts
  currentUserId: number
}

// Etiqueta al estilo del countdown: mayúsculas, tracking amplio, tenue.
const LABEL = "text-[10px] font-medium tracking-widest text-muted-foreground uppercase"

// Hero de cierre del prode: aparece arriba del tab Prode cuando el torneo
// terminó, reemplazando visualmente al countdown. Puramente presentacional —
// toda la data (ranking + curiosidades) ya viene calculada desde `page.tsx`.
export function ProdeClosing({
  entries,
  facts,
  currentUserId,
}: ProdeClosingProps) {
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 bg-card px-6 py-8 text-center ring-1 ring-foreground/10">
        <p className={LABEL}>Mundial FIFA 2026 · Cierre</p>
        <h2 className="font-heading text-2xl font-medium md:text-3xl">
          Se terminó el Mundial
        </h2>
        <p className="text-xs text-muted-foreground">
          Así quedó la tabla final del Prode
        </p>
      </div>

      <Podium entries={entries} currentUserId={currentUserId} />

      <MyWorldCupRecap
        entries={entries}
        facts={facts}
        currentUserId={currentUserId}
      />

      <Palmares facts={facts} />
    </div>
  )
}

const PODIUM = [
  { medal: "🥇", bar: "h-28", fill: "bg-foreground text-background" },
  { medal: "🥈", bar: "h-20", fill: "bg-muted text-muted-foreground" },
  { medal: "🥉", bar: "h-16", fill: "bg-muted text-muted-foreground" },
] as const

function Podium({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: number
}) {
  const top3 = entries.slice(0, 3)
  // Orden visual del podio en desktop: plata (2°) · oro (1°) · bronce (3°).
  const desktopOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold">Podio</CardTitle>
        <CardDescription className={LABEL}>
          Los tres primeros del ranking final
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop: barras escalonadas 2·1·3. */}
        <div className="hidden items-end justify-center gap-3 sm:flex">
          {desktopOrder.map((entry) => (
            <PodiumColumn
              key={entry.userId}
              entry={entry}
              rank={top3.indexOf(entry)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
        {/* Mobile: lista ordenada 1·2·3. */}
        <div className="flex flex-col sm:hidden">
          {top3.map((entry, i) => (
            <div key={entry.userId}>
              {i > 0 && <Separator />}
              <PodiumRow
                entry={entry}
                rank={i}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function YouBadge() {
  return (
    <Badge variant="secondary" className="px-1 py-0 text-[9px]">
      vos
    </Badge>
  )
}

function PodiumColumn({
  entry,
  rank,
  currentUserId,
}: {
  entry: LeaderboardEntry
  rank: number
  currentUserId: number
}) {
  const meta = PODIUM[rank]
  const you = entry.userId === currentUserId
  return (
    <div className="flex w-full max-w-[160px] flex-1 flex-col items-center gap-2">
      <span className="text-2xl leading-none">{meta.medal}</span>
      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        <p className="flex max-w-full items-center gap-1 truncate text-sm font-medium">
          <span className="truncate">{entry.name}</span>
          {you && <YouBadge />}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {entry.totalPoints} pts · {entry.exactCount} ex
        </p>
      </div>
      <div
        className={cn(
          "flex w-full items-start justify-center pt-2 ring-1 ring-foreground/10",
          meta.bar,
          meta.fill,
          you && "ring-2 ring-foreground/40"
        )}
      >
        <span className="text-xl font-medium tabular-nums">{rank + 1}</span>
      </div>
    </div>
  )
}

function PodiumRow({
  entry,
  rank,
  currentUserId,
}: {
  entry: LeaderboardEntry
  rank: number
  currentUserId: number
}) {
  const meta = PODIUM[rank]
  const you = entry.userId === currentUserId
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5",
        you && "-mx-6 bg-muted/40 px-6"
      )}
    >
      <span className="text-xl leading-none">{meta.medal}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {entry.name} {you && <YouBadge />}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {entry.totalPoints} pts · {entry.exactCount} ex
      </span>
    </div>
  )
}

function findTeamFact(rows: UserTeamFact[], name: string | undefined) {
  if (!name) return undefined
  return rows.find((r) => r.userName === name)
}

function MyWorldCupRecap({
  entries,
  facts,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  facts: ProdeFunFacts
  currentUserId: number
}) {
  const index = entries.findIndex((e) => e.userId === currentUserId)

  if (index === -1) {
    return (
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold">Tu Mundial</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No cargaste pronósticos este Mundial. ¡Te esperamos en el próximo!
        </CardContent>
      </Card>
    )
  }

  const me = entries[index]
  const accuracy =
    me.scoredPredictions > 0
      ? ((me.exactCount + me.correctCount) / me.scoredPredictions) * 100
      : 0
  const avgPoints =
    entries.reduce((sum, e) => sum + e.totalPoints, 0) / entries.length
  const diff = me.totalPoints - avgPoints
  const favourite = findTeamFact(facts.favouriteTeamByUser, me.name)
  const jinx = findTeamFact(facts.jinxTeamByUser, me.name)

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold">Tu Mundial</CardTitle>
        <CardDescription className={LABEL}>
          Tu resumen del Prode 2026
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Franja de stats con divisores de 1px (gap-px sobre bg-border). */}
        <div className="grid grid-cols-2 gap-px bg-border ring-1 ring-border sm:grid-cols-3 lg:grid-cols-6">
          <StatCell
            label="Posición"
            value={`#${index + 1}`}
            hint={`de ${entries.length}`}
          />
          <StatCell label="Puntos" value={String(me.totalPoints)} />
          <StatCell label="Exactos" value={String(me.exactCount)} />
          <StatCell label="Racha" value={String(me.longestStreak)} />
          <StatCell label="Acierto" value={`${accuracy.toFixed(0)}%`} />
          <StatCell
            label="vs promedio"
            value={`${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`}
            hint={`prom ${avgPoints.toFixed(1)} pts`}
            info={`El promedio de puntos de todo el prode es ${avgPoints.toFixed(1)}. Con tus ${me.totalPoints} pts quedaste ${Math.abs(diff).toFixed(1)} ${diff >= 0 ? "por encima" : "por debajo"}.`}
          />
        </div>
        {(favourite || jinx) && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {favourite && (
              <RecapTeam
                label="Selección fetiche"
                fact={favourite}
                metric={`${favourite.value} pts`}
              />
            )}
            {jinx && (
              <RecapTeam
                label="Selección yeta"
                fact={jinx}
                metric={`${jinx.value} fallos`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatCell({
  label,
  value,
  hint,
  info,
}: {
  label: string
  value: string
  hint?: string
  info?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-card px-2 py-4 text-center">
      <span className="text-2xl font-medium tabular-nums md:text-3xl">
        {value}
      </span>
      <span className={cn(LABEL, "flex items-center gap-1")}>
        {label}
        {info && <StatInfo text={info} />}
      </span>
      {hint && (
        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
          {hint}
        </span>
      )}
    </div>
  )
}

function RecapTeam({
  label,
  fact,
  metric,
}: {
  label: string
  fact: UserTeamFact
  metric: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2 text-xs ring-1 ring-border">
      <span className={LABEL}>{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        <Flag flagUrl={fact.flagUrl} />
        <span className="truncate">{fact.team}</span>
        <span className="text-muted-foreground tabular-nums">{metric}</span>
      </span>
    </div>
  )
}

interface Award {
  emoji: string
  label: string
  winner?: string
  metric?: string
}

// El #1 de cada categoría de "Reyes" de Curiosidades, reencuadrado como premios
// especiales del cierre. Reusa los rankings ya calculados en `facts`.
function Palmares({ facts }: { facts: ProdeFunFacts }) {
  const awards: Award[] = [
    {
      emoji: "🎯",
      label: "Rey del acierto",
      winner: facts.accuracyKings[0]?.userName,
      metric: facts.accuracyKings[0]
        ? `${facts.accuracyKings[0].pct.toFixed(0)}%`
        : undefined,
    },
    {
      emoji: "⚡",
      label: "Rey de la eficiencia",
      winner: facts.efficiencyKings[0]?.userName,
      metric: facts.efficiencyKings[0]?.avg.toFixed(2),
    },
    {
      emoji: "🎰",
      label: "Rey del pleno",
      winner: facts.plenoKings[0]?.userName,
      metric: facts.plenoKings[0] ? `${facts.plenoKings[0].value}` : undefined,
    },
    {
      emoji: "🔥",
      label: "Rey de la racha",
      winner: facts.streakKings[0]?.userName,
      metric: facts.streakKings[0] ? `${facts.streakKings[0].value}` : undefined,
    },
    {
      emoji: "🥊",
      label: "Rey del mata-mata",
      winner: facts.knockoutKings[0]?.userName,
      metric: facts.knockoutKings[0]?.avg.toFixed(2),
    },
    {
      emoji: "🎲",
      label: "Rey de la sorpresa",
      winner: facts.surpriseKings[0]?.userName,
      metric: facts.surpriseKings[0]
        ? `${facts.surpriseKings[0].value}`
        : undefined,
    },
  ].filter((a) => a.winner)

  if (awards.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold">
          Premios especiales
        </CardTitle>
        <CardDescription className={LABEL}>
          Los reyes del Prode 2026
        </CardDescription>
        <CardAction>
          <FunFactsLink />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-px bg-border ring-1 ring-border sm:grid-cols-2 xl:grid-cols-3">
          {awards.map((award) => (
            <div
              key={award.label}
              className="flex items-center gap-3 bg-card px-3 py-2.5"
            >
              <span className="text-lg leading-none">{award.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className={LABEL}>{award.label}</p>
                <p className="truncate text-sm font-medium">{award.winner}</p>
              </div>
              {award.metric && (
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  {award.metric}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
