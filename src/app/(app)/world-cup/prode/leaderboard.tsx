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

export interface LeaderboardEntry {
  userId: number
  name: string
  email: string
  totalPoints: number
  exactCount: number
  correctCount: number
  totalPredictions: number
  scoredPredictions: number
  currentStreak: number
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
    <Card className="2xl:sticky 2xl:top-4 bg-transparent border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Ranking</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay usuarios registrados todavía.
          </p>
        ) : (
          <>
            {/* Compacta: mobile (<md) y sidebar angosto (>=2xl) */}
            <div className="block md:hidden 2xl:block">
              <LeaderboardTable
                entries={entries}
                currentUserId={currentUserId}
              />
            </div>
            {/* Detallada inline: ranking full-width entre md y xl */}
            <div className="hidden md:block 2xl:hidden">
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
          {/* El dialog "Ver más datos" solo se justifica donde se ve la tabla
              compacta: mobile (<md) y sidebar angosto (>=2xl). */}
          <div className="md:hidden 2xl:block">
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
