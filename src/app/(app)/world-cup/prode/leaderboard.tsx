import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  userId: number
  name: string
  totalPoints: number
  exactCount: number
  correctCount: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: number
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <Card className="lg:sticky lg:top-4 bg-transparent border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Ranking</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay usuarios registrados todavía.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Pts</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Exactos</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Correctos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, i) => (
                <TableRow
                  key={entry.userId}
                  className={cn(entry.userId === currentUserId && "bg-muted/40")}
                >
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.name}
                    {entry.userId === currentUserId && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">(vos)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {entry.totalPoints}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                    {entry.exactCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                    {entry.correctCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
