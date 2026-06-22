import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Flag } from "./stat-flag"
import type {
  TournamentStats,
  TeamStat,
  RecordMatch,
  FairPlayTeam,
} from "./types"

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </CardContent>
    </Card>
  )
}

function RecordCard({
  title,
  match,
}: {
  title: string
  match: RecordMatch | null
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {match ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="flex flex-1 items-center justify-end gap-1.5 truncate">
              <span className="truncate">{match.team1}</span>
              <Flag flagUrl={match.team1FlagUrl} />
            </span>
            <span className="shrink-0 font-mono text-base font-semibold tabular-nums">
              {match.homeScore} - {match.awayScore}
            </span>
            <span className="flex flex-1 items-center gap-1.5 truncate">
              <Flag flagUrl={match.team2FlagUrl} />
              <span className="truncate">{match.team2}</span>
            </span>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Sin datos aún
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function RankingCard({
  title,
  subtitle,
  metricLabel,
  rows,
}: {
  title: string
  subtitle: string
  metricLabel: string
  rows: { name: string; flagUrl?: string; value: number }[]
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-[11px]">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              <TableHead className="w-6 px-2">#</TableHead>
              <TableHead className="px-2">Equipo</TableHead>
              <TableHead className="w-12 px-2 text-center">
                {metricLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.name} className="text-xs">
                <TableCell className="px-2 py-1.5 text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-[160px] truncate px-2 py-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Flag flagUrl={r.flagUrl} />
                    {r.name}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-1.5 text-center font-semibold tabular-nums">
                  {r.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const TOP_N = 8

function topBy(
  teams: TeamStat[],
  pick: (t: TeamStat) => number,
  dir: "desc" | "asc" = "desc"
) {
  return [...teams]
    .sort((a, b) => (dir === "desc" ? pick(b) - pick(a) : pick(a) - pick(b)))
    .slice(0, TOP_N)
    .map((t) => ({ name: t.name, flagUrl: t.flagUrl, value: pick(t) }))
}

export function TeamStatistics({
  stats,
  fairPlay,
}: {
  stats: TournamentStats
  fairPlay: FairPlayTeam[]
}) {
  if (stats.matchesPlayed === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay partidos jugados. Las estadísticas aparecerán cuando se
          dispute el primer partido.
        </CardContent>
      </Card>
    )
  }

  // El TeamConductScore de FIFA es 0 = mejor conducta y resta por tarjetas
  // (amarilla -1, doble amarilla -3, roja -4...). Un ranking de "mejor fair
  // play" sería decenas de equipos en 0; mostramos los sancionados (los que
  // tienen puntos negativos), del más sancionado al menos, en positivo.
  const disciplineRows = fairPlay
    .filter((t) => t.conductScore < 0)
    .sort((a, b) => a.conductScore - b.conductScore)
    .slice(0, TOP_N)
    .map((t) => ({
      name: t.name,
      flagUrl: t.flagUrl,
      value: Math.abs(t.conductScore),
    }))

  return (
    <div className="space-y-4">
      {/* Resumen del torneo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Goles totales"
          value={String(stats.totalGoals)}
          hint={`en ${stats.matchesPlayed} partidos`}
        />
        <SummaryCard
          label="Promedio por partido"
          value={stats.avgGoals.toFixed(2)}
          hint="goles/partido"
        />
        <SummaryCard
          label="Partidos jugados"
          value={`${stats.matchesPlayed} / ${stats.totalMatches}`}
          hint={`${stats.totalMatches - stats.matchesPlayed} restantes`}
        />
        <SummaryCard
          label="Goleadas"
          value={String(stats.blowouts)}
          hint="diferencia de 3+ goles"
        />
      </div>

      {/* Récords */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecordCard title="Mayor goleada" match={stats.biggestWin} />
        <RecordCard title="Partido con más goles" match={stats.highestScoring} />
      </div>

      {/* Rankings de equipos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <RankingCard
          title="Más goles a favor"
          subtitle="Goles convertidos en el torneo"
          metricLabel="GF"
          rows={topBy(stats.teams, (t) => t.goalsFor)}
        />
        <RankingCard
          title="Mejor defensa"
          subtitle="Menos goles recibidos"
          metricLabel="GC"
          rows={topBy(stats.teams, (t) => t.goalsAgainst, "asc")}
        />
        <RankingCard
          title="Mejor diferencia de gol"
          subtitle="Goles a favor menos en contra"
          metricLabel="DG"
          rows={topBy(stats.teams, (t) => t.goalDifference)}
        />
        <RankingCard
          title="Más victorias"
          subtitle="Partidos ganados en el torneo"
          metricLabel="G"
          rows={topBy(stats.teams, (t) => t.won)}
        />
        <RankingCard
          title="Vallas invictas"
          subtitle="Partidos sin recibir goles"
          metricLabel="VI"
          rows={topBy(stats.teams, (t) => t.cleanSheets)}
        />
        {disciplineRows.length > 0 && (
          <RankingCard
            title="Más sancionados"
            subtitle="Puntos de penalización por tarjetas"
            metricLabel="Pts"
            rows={disciplineRows}
          />
        )}
      </div>
    </div>
  )
}
