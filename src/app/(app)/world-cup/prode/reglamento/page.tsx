import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { COLUMNS } from "../leaderboard-columns"

export const metadata: Metadata = {
  title: "Reglamento del Prode",
}

function PointsBadge({ points }: { points: number }) {
  return (
    <Badge
      variant="outline"
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

export default function ReglamentoPage() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Link
        href="/world-cup"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al Prode
      </Link>

      <h1 className="text-xl font-medium md:text-2xl lg:text-3xl">
        Reglamento del Prode
      </h1>

      {/* 1. Cómo funciona */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Pronosticá el marcador de cada uno de los 104 partidos del Mundial
            2026. Hay un único pool: todos los participantes compiten entre sí en
            un mismo ranking global.
          </p>
          <p>
            Cargá tu predicción antes de que empiece cada partido y sumá puntos
            según qué tan cerca estuviste del resultado real.
          </p>
        </CardContent>
      </Card>

      {/* 2. Puntuación */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Sistema de puntuación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Marcador exacto</TableCell>
                <TableCell className="flex justify-end">
                  <PointsBadge points={2} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  Resultado acertado (1X2 — ganador o empate)
                </TableCell>
                <TableCell className="flex justify-end">
                  <PointsBadge points={1} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Resultado incorrecto</TableCell>
                <TableCell className="flex justify-end">
                  <PointsBadge points={0} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Ejemplos (resultado 2-1):</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Predijiste <span className="font-mono">2-1</span> → 2 pts
                (marcador exacto).
              </li>
              <li>
                Predijiste <span className="font-mono">1-0</span> → 1 pt
                (acertaste que ganaba el local).
              </li>
              <li>
                Predijiste <span className="font-mono">0-2</span> → 0 pts.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 3. Cierre de predicciones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Cierre de predicciones
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Una predicción no se puede crear ni modificar una vez que el partido
            empezó. Asegurate de cargar o editar tu marcador antes del inicio.
          </p>
        </CardContent>
      </Card>

      {/* 4. Fase eliminatoria */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Fase eliminatoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            En los partidos de eliminación directa el marcador se evalúa igual
            que siempre: sobre el resultado al final de los 90 minutos
            reglamentarios (no se cuenta el alargue).
          </p>
          <p>
            Además, si en un partido de llave predecís un{" "}
            <span className="font-medium text-foreground">empate</span>, elegís{" "}
            <span className="font-medium text-foreground">quién pasa</span>. Si
            el partido termina empatado y se define por penales, sumás un{" "}
            <span className="font-medium text-foreground">bonus de +1</span> por
            acertar el equipo que clasifica. (Si predecís un ganador, el
            clasificado ya queda implícito en tu marcador.) Si el partido no va a
            penales no hay bonus: el resultado 1X2 ya define quién pasó.
          </p>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Ejemplo (1-1 en 90&apos;, gana por penales el local):
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Predijiste <span className="font-mono">1-1</span> y “pasa el
                local” → 2 (marcador exacto) + 1 (bonus) ={" "}
                <PointsBadge points={3} />
              </li>
              <li>
                Predijiste <span className="font-mono">0-0</span> y “pasa el
                local” → 1 (acertaste el empate) + 1 (bonus) ={" "}
                <PointsBadge points={2} />
              </li>
              <li>
                Acertaste el empate pero elegiste mal quién pasa → sin bonus,
                pero conservás los puntos del marcador:{" "}
                <PointsBadge points={2} /> si era exacto,{" "}
                <PointsBadge points={1} /> si no. El bonus solo suma, nunca
                resta.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 5. Ranking y desempate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Ranking y desempate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>El ranking se ordena por:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Puntos totales (mayor a menor).</li>
            <li>Cantidad de marcadores exactos.</li>
            <li>Fecha de la última predicción cargada.</li>
          </ol>
          <p>
            Quienes no cargaron ninguna predicción no figuran en el ranking.
          </p>
        </CardContent>
      </Card>

      {/* 6. Visibilidad */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Visibilidad de las predicciones
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Las predicciones del resto de los participantes para un partido se
            pueden ver recién una vez que ese partido empezó.
          </p>
        </CardContent>
      </Card>

      {/* 7. Glosario del ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Glosario del ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Columna</TableHead>
                <TableHead>Significado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COLUMNS.map((col) => (
                <TableRow key={col.key}>
                  <TableCell className="font-mono font-medium whitespace-nowrap">
                    {col.label}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {col.help}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 8. Premios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Premios</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>A definir. Los detalles del pozo se anunciarán más adelante.</p>
        </CardContent>
      </Card>
    </div>
  )
}
