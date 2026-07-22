"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Isla cliente: un ícono de ayuda con tooltip para explicar una métrica. Mismo
// patrón que la ayuda de columnas del leaderboard (`leaderboard-table.tsx`).
export function StatInfo({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Qué significa"
          className="text-muted-foreground/60 transition-colors hover:cursor-help hover:text-foreground"
        >
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-center">{text}</TooltipContent>
    </Tooltip>
  )
}
