"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react"
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
export function pct(part: number, scored: number): string {
  if (scored === 0) return "—"
  return `${Math.round((part / scored) * 100)}%`
}

export function avg(points: number, scored: number): string {
  if (scored === 0) return "—"
  return (points / scored).toFixed(2)
}

export const COLUMNS: { key: string; label: string; help: string }[] = [
  { key: "pts", label: "Pts", help: "Puntos totales" },
  {
    key: "exact",
    label: "Exact",
    help: "Aciertos exactos (resultado y marcador, 2 pts)",
  },
  {
    key: "bien",
    label: "Bien",
    help: "Resultado acertado pero marcador distinto (1 pt)",
  },
  {
    key: "fall",
    label: "Fall",
    help: "Fallados: partidos evaluados sin puntos",
  },
  { key: "ac", label: "%Ac", help: "% de aciertos sobre partidos evaluados" },
  {
    key: "ex",
    label: "%Ex",
    help: "% de aciertos exactos sobre partidos evaluados",
  },
  {
    key: "prom",
    label: "Prom",
    help: "Promedio de puntos por partido evaluado",
  },
  { key: "carg", label: "Carg", help: "Pronósticos cargados (total)" },
  { key: "eval", label: "Eval", help: "Partidos ya jugados de los cargados" },
  {
    key: "racha",
    label: "Racha",
    help: "Partidos consecutivos sumando puntos",
  },
  {
    key: "maxracha",
    label: "Máx",
    help: "Racha más larga alcanzada (histórica)",
  },
]

// Valor numérico por columna para ordenar. Las tasas/promedio devuelven null
// cuando no hay partidos evaluados ("—") para mandar esas filas al final.
function sortValue(entry: LeaderboardEntry, key: string): number | null {
  const scored = entry.scoredPredictions
  const missed = scored - entry.exactCount - entry.correctCount
  switch (key) {
    case "pts":
      return entry.totalPoints
    case "exact":
      return entry.exactCount
    case "bien":
      return entry.correctCount
    case "fall":
      return missed
    case "ac":
      return scored === 0
        ? null
        : (entry.exactCount + entry.correctCount) / scored
    case "ex":
      return scored === 0 ? null : entry.exactCount / scored
    case "prom":
      return scored === 0 ? null : entry.totalPoints / scored
    case "carg":
      return entry.totalPredictions
    case "eval":
      return scored
    case "racha":
      return entry.currentStreak
    case "maxracha":
      return entry.longestStreak
    default:
      return null
  }
}

type SortState = { key: string; dir: "asc" | "desc" }

export function LeaderboardTable({
  entries,
  currentUserId,
  detailed = false,
}: {
  entries: LeaderboardEntry[]
  currentUserId: number
  detailed?: boolean
}) {
  const [sort, setSort] = useState<SortState | null>(null)

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" }
    )
  }

  // Sin ordenamiento activo (o en vista compacta) respetamos el orden que llega
  // del server (puntos desc). El sort es estable → empates mantienen ese orden.
  const rows = useMemo(() => {
    if (!detailed || !sort) return entries
    return [...entries].sort((a, b) => {
      const va = sortValue(a, sort.key)
      const vb = sortValue(b, sort.key)
      if (va === null && vb === null) return 0
      if (va === null) return 1
      if (vb === null) return -1
      return sort.dir === "desc" ? vb - va : va - vb
    })
  }, [entries, detailed, sort])

  return (
    <>
      {detailed && sort && (
        <div className="flex justify-end px-2 pb-2">
          <button
            type="button"
            onClick={() => setSort(null)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Restablecer orden
          </button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 px-2">#</TableHead>
            <TableHead className="px-2">Usuario</TableHead>
            {detailed ? (
              COLUMNS.map((col) => {
                const active = sort?.key === col.key
                return (
                  <TableHead
                    key={col.key}
                    className="px-2 text-right text-xs whitespace-nowrap"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            "ml-auto inline-flex cursor-pointer items-center gap-0.5 underline decoration-dotted underline-offset-2",
                            active && "text-foreground"
                          )}
                        >
                          {col.label}
                          {active &&
                            (sort.dir === "desc" ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUp className="size-3" />
                            ))}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{col.help}</TooltipContent>
                    </Tooltip>
                  </TableHead>
                )
              })
            ) : (
              <>
                <TableHead className="px-2 text-right text-xs">Pts</TableHead>
                <TableHead className="px-2 text-right text-xs">
                  Exacto
                </TableHead>
                <TableHead className="px-2 text-right text-xs">Bien</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry, i) => {
            const mine = entry.userId === currentUserId
            const missed =
              entry.scoredPredictions - entry.exactCount - entry.correctCount
            return (
              <TableRow
                key={entry.userId}
                className={cn(mine && "bg-muted/40")}
              >
                <TableCell className="px-2 font-mono text-xs text-muted-foreground tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell className="px-2">
                  <div className="leading-tight font-medium">
                    {entry.name}
                    {mine && (
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                        (vos)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] break-all text-muted-foreground">
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
                {detailed && (
                  <>
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
                    <TableCell className="px-2 text-right font-mono text-muted-foreground tabular-nums">
                      {entry.longestStreak}
                    </TableCell>
                  </>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
