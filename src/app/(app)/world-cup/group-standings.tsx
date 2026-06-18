import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { GroupStanding } from "./types"

function positionColor(index: number) {
  if (index < 2) return "border-l-2 border-l-green-500"
  if (index === 2) return "border-l-2 border-l-yellow-500"
  return ""
}

function GroupTable({ standing }: { standing: GroupStanding }) {
  return (
    <Card className="w-96">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {standing.group}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              <TableHead className="w-6 px-2">#</TableHead>
              <TableHead className="px-2">Equipo</TableHead>
              <TableHead className="w-7 px-1 text-center">PJ</TableHead>
              <TableHead className="w-7 px-1 text-center">G</TableHead>
              <TableHead className="w-7 px-1 text-center">E</TableHead>
              <TableHead className="w-7 px-1 text-center">P</TableHead>
              <TableHead className="hidden w-7 px-1 text-center sm:table-cell">
                GF
              </TableHead>
              <TableHead className="hidden w-7 px-1 text-center sm:table-cell">
                GC
              </TableHead>
              <TableHead className="w-7 px-1 text-center">DG</TableHead>
              <TableHead className="w-8 px-1 text-center font-bold">
                Pts
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standing.teams.map((team, i) => (
              <TableRow
                key={team.name}
                className={cn("text-xs", positionColor(i))}
              >
                <TableCell className="px-2 py-1.5 text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-[120px] truncate px-2 py-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    {team.flagUrl && (
                      <Image
                        src={team.flagUrl}
                        alt={team.name}
                        width={16}
                        height={16}
                        className="shrink-0 rounded-sm"
                        unoptimized
                      />
                    )}
                    {team.name}
                  </span>
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center text-muted-foreground">
                  {team.played}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center">
                  {team.won}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center">
                  {team.drawn}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center">
                  {team.lost}
                </TableCell>
                <TableCell className="hidden px-1 py-1.5 text-center text-muted-foreground sm:table-cell">
                  {team.goalsFor}
                </TableCell>
                <TableCell className="hidden px-1 py-1.5 text-center text-muted-foreground sm:table-cell">
                  {team.goalsAgainst}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center text-muted-foreground">
                  {team.goalDifference}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center font-bold">
                  {team.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function GroupStandings({ standings }: { standings: GroupStanding[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-500" />{" "}
          Clasifica a 16avos
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-yellow-500" />{" "}
          Posible mejor 3°
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {standings.map((s) => (
          <GroupTable key={s.group} standing={s} />
        ))}
      </div>
    </div>
  )
}
