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
import type { TournamentStats, TeamStat, FairPlayTeam } from "./types"

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
