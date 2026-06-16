"use client"

import { BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "./leaderboard"

// Tasas/promedio se calculan sobre partidos evaluados (los ya jugados).
// Sin partidos evaluados no hay denominador → mostramos "—".
function pct(part: number, scored: number): string {
  if (scored === 0) return "—"
  return `${Math.round((part / scored) * 100)}%`
}

function avg(points: number, scored: number): string {
  if (scored === 0) return "—"
  return (points / scored).toFixed(2)
}

const COLUMNS: { key: string; label: string; help: string }[] = [
  { key: "pts", label: "Pts", help: "Puntos totales" },
  { key: "exact", label: "Exact", help: "Aciertos exactos (resultado y marcador, 2 pts)" },
  { key: "bien", label: "Bien", help: "Resultado acertado pero marcador distinto (1 pt)" },
  { key: "fall", label: "Fall", help: "Fallados: partidos evaluados sin puntos" },
  { key: "ac", label: "%Ac", help: "% de aciertos sobre partidos evaluados" },
  { key: "ex", label: "%Ex", help: "% de aciertos exactos sobre partidos evaluados" },
  { key: "prom", label: "Prom", help: "Promedio de puntos por partido evaluado" },
  { key: "carg", label: "Carg", help: "Pronósticos cargados (total)" },
  { key: "eval", label: "Eval", help: "Partidos ya jugados de los cargados" },
  { key: "racha", label: "Racha", help: "Partidos consecutivos sumando puntos" },
]

export function LeaderboardDialog({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: number
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <BarChart3 className="size-4" />
          Ver más datos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Ranking completo</DialogTitle>
          <DialogDescription className="text-xs">
            Tasas y promedio calculados sobre partidos ya jugados.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 px-2">#</TableHead>
                <TableHead className="px-2">Usuario</TableHead>
                {COLUMNS.map((col) => (
                  <TableHead
                    key={col.key}
                    className="px-2 text-right text-xs whitespace-nowrap"
                  >
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
                        {col.label}
                      </TooltipTrigger>
                      <TooltipContent>{col.help}</TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, i) => {
                const missed =
                  entry.scoredPredictions -
                  entry.exactCount -
                  entry.correctCount
                const mine = entry.userId === currentUserId
                return (
                  <TableRow
                    key={entry.userId}
                    className={cn(mine && "bg-muted/40")}
                  >
                    <TableCell className="px-2 font-mono text-xs text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="font-medium leading-tight">
                        {entry.name}
                        {mine && (
                          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                            (vos)
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground break-all">
                        ({entry.email})
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono font-semibold tabular-nums">
                      {entry.totalPoints}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.exactCount}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.correctCount}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {missed}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono tabular-nums">
                      {pct(
                        entry.exactCount + entry.correctCount,
                        entry.scoredPredictions
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {pct(entry.exactCount, entry.scoredPredictions)}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {avg(entry.totalPoints, entry.scoredPredictions)}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.totalPredictions}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.scoredPredictions}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.currentStreak}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
