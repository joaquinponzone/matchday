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
import { Flag } from "../stat-flag"
import type {
  ProdeFunFacts,
  TeamValue,
  UserTeamFact,
  UserValue,
  RecordMatchFact,
} from "./fun-facts"

function UserTeamCard({
  title,
  subtitle,
  metricLabel,
  rows,
}: {
  title: string
  subtitle: string
  metricLabel: string
  rows: UserTeamFact[]
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
              <TableHead className="px-2">Usuario</TableHead>
              <TableHead className="px-2">Selección</TableHead>
              <TableHead className="w-12 px-2 text-center">
                {metricLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.userName} className="text-xs">
                <TableCell className="max-w-[120px] truncate px-2 py-1.5 font-medium">
                  {r.userName}
                </TableCell>
                <TableCell className="max-w-[140px] truncate px-2 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Flag flagUrl={r.flagUrl} />
                    {r.team}
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

function TeamRankingCard({
  title,
  subtitle,
  metricLabel,
  rows,
}: {
  title: string
  subtitle: string
  metricLabel: string
  rows: TeamValue[]
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
              <TableHead className="px-2">Selección</TableHead>
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

function UserRankingCard({
  title,
  subtitle,
  metricLabel,
  rows,
}: {
  title: string
  subtitle: string
  metricLabel: string
  rows: UserValue[]
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
              <TableHead className="px-2">Usuario</TableHead>
              <TableHead className="w-12 px-2 text-center">
                {metricLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.userName} className="text-xs">
                <TableCell className="px-2 py-1.5 text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-[160px] truncate px-2 py-1.5 font-medium">
                  {r.userName}
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

function RecordMatchCard({
  title,
  subtitle,
  metricLabel,
  match,
}: {
  title: string
  subtitle: string
  metricLabel: string
  match: RecordMatchFact | null
}) {
  if (!match) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-[11px]">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-1">
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
        <p className="text-center text-[11px] text-muted-foreground">
          {match.count} {metricLabel}
        </p>
      </CardContent>
    </Card>
  )
}

function ScorerCard({ facts }: { facts: ProdeFunFacts }) {
  if (!facts.topScorer && !facts.bottomScorer) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Goleadores del prode
        </CardTitle>
        <CardDescription className="text-[11px]">
          Promedio de goles pronosticados por partido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-1 text-xs">
        {facts.topScorer && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">🔥 El optimista</span>
            <span className="font-medium">
              {facts.topScorer.userName}{" "}
              <span className="font-semibold tabular-nums">
                ({facts.topScorer.avg.toFixed(2)})
              </span>
            </span>
          </div>
        )}
        {facts.bottomScorer && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">🧊 El amarrete</span>
            <span className="font-medium">
              {facts.bottomScorer.userName}{" "}
              <span className="font-semibold tabular-nums">
                ({facts.bottomScorer.avg.toFixed(2)})
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function FunFactsSection({ facts }: { facts: ProdeFunFacts }) {
  if (!facts.hasData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Aún no hay pronósticos evaluados. Las curiosidades aparecerán cuando se
          jueguen los primeros partidos.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ScorerCard facts={facts} />
      <RecordMatchCard
        title="Partido más acertado"
        subtitle="El que más plenos cosechó"
        metricLabel="plenos"
        match={facts.mostAccuratedMatch}
      />
      <RecordMatchCard
        title="Partido maldito"
        subtitle="El que más fallos causó"
        metricLabel="fallos"
        match={facts.cursedMatch}
      />
      <UserTeamCard
        title="Selección fetiche"
        subtitle="La que más puntos le dio a cada usuario"
        metricLabel="Pts"
        rows={facts.favouriteTeamByUser}
      />
      <UserTeamCard
        title="Selección yeta"
        subtitle="La que más fallos le causó a cada usuario"
        metricLabel="Fall"
        rows={facts.jinxTeamByUser}
      />
      <TeamRankingCard
        title="Más plenos por selección"
        subtitle="Selecciones con más marcadores exactos acertados"
        metricLabel="Plen"
        rows={facts.mostExactByTeam}
      />
      <UserRankingCard
        title="Rey de la victoria"
        subtitle="Más aciertos en partidos que terminaron con algún ganador"
        metricLabel="Vic"
        rows={facts.victoryKings}
      />
      <UserRankingCard
        title="Rey del empate"
        subtitle="Más empates acertados (resultado real empatado)"
        metricLabel="Emp"
        rows={facts.drawKings}
      />
      <UserRankingCard
        title="Rey de la derrota"
        subtitle="Más fallos en partidos que terminaron con algún ganador"
        metricLabel="Der"
        rows={facts.defeatKings}
      />
      <UserRankingCard
        title="Rey de la sorpresa"
        subtitle="Aciertos en partidos donde menos de la mitad acertó"
        metricLabel="Sor"
        rows={facts.surpriseKings}
      />
      <UserRankingCard
        title="Rey del pleno"
        subtitle="Más marcadores exactos acertados en total"
        metricLabel="Plen"
        rows={facts.plenoKings}
      />
      <UserRankingCard
        title="Rey de la racha"
        subtitle="Racha más larga de partidos seguidos sumando puntos"
        metricLabel="Máx"
        rows={facts.streakKings}
      />
    </div>
  )
}
