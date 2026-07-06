import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SyncResultsButton } from "./sync-results-button"
import { LeaderboardDialog } from "./leaderboard-dialog"
import { LeaderboardTable } from "./leaderboard-table"
import { FunFactsLink } from "./fun-facts-link"

export interface LeaderboardEntry {
  userId: number
  name: string
  email: string
  totalPoints: number
  exactCount: number
  correctCount: number
  missedCount: number
  totalPredictions: number
  scoredPredictions: number
  currentStreak: number
  longestStreak: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: number
  isAdmin?: boolean
}

export function Leaderboard({
  entries,
  currentUserId,
  isAdmin,
}: LeaderboardProps) {
  return (
    <Card className="border-none bg-transparent 2xl:sticky 2xl:top-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Ranking</CardTitle>
          <FunFactsLink />
        </div>
        <p className="hidden text-xs text-muted-foreground md:block 2xl:hidden 2xl:[.lb-wide_&]:block">
          Clickeá los encabezados para reordenar.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay usuarios registrados todavía.
          </p>
        ) : (
          <>
            {/* Compacta vs detallada: por viewport en el layout apilado (mobile
                → compacta; md-xl full-width → detallada). En 2xl la decide el
                ancho de la columna vía la clase `.lb-wide` que pone
                PredictionsList en modo "Hoy" (ranking ancho → detallada). */}
            <div className="block md:hidden 2xl:block 2xl:[.lb-wide_&]:hidden">
              <LeaderboardTable
                entries={entries}
                currentUserId={currentUserId}
              />
            </div>
            <div className="hidden md:block 2xl:hidden 2xl:[.lb-wide_&]:block">
              <LeaderboardTable
                entries={entries}
                currentUserId={currentUserId}
                detailed
              />
            </div>
          </>
        )}
      </CardContent>
      {entries.length > 0 && (
        <CardFooter className="flex items-center gap-2 pt-3">
          {/* El dialog "Ver más datos" solo donde se ve la tabla compacta. */}
          <div className="md:hidden 2xl:block 2xl:[.lb-wide_&]:hidden">
            <LeaderboardDialog
              entries={entries}
              currentUserId={currentUserId}
            />
          </div>
          {isAdmin && (
            <div className="ml-auto">
              <SyncResultsButton />
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
