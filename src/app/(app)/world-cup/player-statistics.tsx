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
import { fetchWCPlayerLeaderboards } from "@/lib/fifa"
import { Flag } from "./stat-flag"
import type { PlayerLeaderboards, PlayerStatRow } from "./types"

function PlayerRankingCard({
  title,
  subtitle,
  metricLabel,
  secondaryLabel,
  rows,
}: {
  title: string
  subtitle: string
  metricLabel: string
  secondaryLabel?: string
  rows: PlayerStatRow[]
}) {
  if (rows.length === 0) return null

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
              <TableHead className="px-2">Jugador</TableHead>
              {secondaryLabel && (
                <TableHead className="w-12 px-2 text-center">
                  {secondaryLabel}
                </TableHead>
              )}
              <TableHead className="w-12 px-2 text-center">
                {metricLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.idPlayer} className="text-xs">
                <TableCell className="px-2 py-1.5 text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-[180px] truncate px-2 py-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Flag flagUrl={r.flagUrl} />
                    <span className="truncate">{r.name}</span>
                    {r.country && (
                      <span className="text-[10px] text-muted-foreground">
                        {r.country}
                      </span>
                    )}
                  </span>
                </TableCell>
                {secondaryLabel && (
                  <TableCell className="px-2 py-1.5 text-center text-muted-foreground tabular-nums">
                    {r.assists ?? 0}
                  </TableCell>
                )}
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

// Fallback de Suspense mientras se resuelve el feed (pesado) del Data Hub.
export function PlayerStatisticsFallback() {
  return (
    <Card>
      <CardContent className="p-8 text-center text-sm text-muted-foreground">
        Cargando estadísticas de jugadores…
      </CardContent>
    </Card>
  )
}

// Server component async: aísla el fetch pesado de jugadores para que se
// transmita por streaming (Suspense) sin bloquear el resto de la página.
export async function PlayerStatisticsSection() {
  const leaderboards = await fetchWCPlayerLeaderboards()
  return <PlayerStatistics leaderboards={leaderboards} />
}

export function PlayerStatistics({
  leaderboards,
}: {
  leaderboards: PlayerLeaderboards
}) {
  const hasData =
    leaderboards.topScorers.length > 0 ||
    leaderboards.topAssists.length > 0 ||
    leaderboards.topYellowCards.length > 0 ||
    leaderboards.topRedCards.length > 0 ||
    leaderboards.topMinutes.length > 0 ||
    leaderboards.topPasses.length > 0 ||
    leaderboards.topShots.length > 0 ||
    leaderboards.topDistance.length > 0 ||
    leaderboards.topSaves.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay datos de jugadores. Las estadísticas aparecerán cuando se
          dispute el primer partido.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <PlayerRankingCard
        title="Goleadores"
        subtitle="Máximos goleadores del torneo"
        metricLabel="G"
        secondaryLabel="A"
        rows={leaderboards.topScorers}
      />
      <PlayerRankingCard
        title="Asistencias"
        subtitle="Máximos asistidores del torneo"
        metricLabel="A"
        rows={leaderboards.topAssists}
      />
      <PlayerRankingCard
        title="Tarjetas amarillas"
        subtitle="Jugadores con más amarillas"
        metricLabel="TA"
        rows={leaderboards.topYellowCards}
      />
      <PlayerRankingCard
        title="Tarjetas rojas"
        subtitle="Jugadores con más rojas"
        metricLabel="TR"
        rows={leaderboards.topRedCards}
      />
      <PlayerRankingCard
        title="Minutos jugados"
        subtitle="Jugadores con más minutos en cancha"
        metricLabel="Min"
        rows={leaderboards.topMinutes}
      />
      <PlayerRankingCard
        title="Pases"
        subtitle="Jugadores con más pases"
        metricLabel="Pases"
        rows={leaderboards.topPasses}
      />
      <PlayerRankingCard
        title="Remates"
        subtitle="Tiros al arco totales"
        metricLabel="Tiros"
        rows={leaderboards.topShots}
      />
      <PlayerRankingCard
        title="Distancia recorrida"
        subtitle="Kilómetros recorridos"
        metricLabel="km"
        rows={leaderboards.topDistance}
      />
      <PlayerRankingCard
        title="Atajadas"
        subtitle="Arqueros con más atajadas"
        metricLabel="Ataj."
        rows={leaderboards.topSaves}
      />
    </div>
  )
}
