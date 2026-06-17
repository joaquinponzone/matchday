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
import { LeaderboardTable } from "./leaderboard-table"
import type { LeaderboardEntry } from "./leaderboard"

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
          <LeaderboardTable
            entries={entries}
            currentUserId={currentUserId}
            detailed
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
