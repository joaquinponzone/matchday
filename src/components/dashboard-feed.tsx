"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { fixtureUiKey } from "@/lib/fixture.types"
import type { DashboardFixture } from "@/lib/types"

import { MatchCard } from "./match-card"
import { MatchHero } from "./match-hero"

const UPCOMING_QUERY_KEY = ["fixtures", "upcoming"] as const

interface UpcomingPayload {
  fixtures: DashboardFixture[]
  upcomingDaysBack: number
  upcomingDaysForward: number
}

export function DashboardFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: UPCOMING_QUERY_KEY,
    queryFn: async (): Promise<UpcomingPayload> => {
      const res = await fetch("/api/fixtures/upcoming")
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Error al cargar partidos")
      }
      return {
        fixtures: json.fixtures ?? [],
        upcomingDaysBack: Number(json.upcomingDaysBack ?? 0),
        upcomingDaysForward: Number(json.upcomingDaysForward ?? 45),
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        Cargando partidos…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Error al cargar partidos"}
        </p>
      </div>
    )
  }

  const upcoming = data?.fixtures ?? []
  const daysForward = data?.upcomingDaysForward ?? 45
  const daysBack = data?.upcomingDaysBack ?? 0
  const [hero, ...rest] = upcoming

  if (!hero) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-muted-foreground max-w-md">
          No hay partidos programados en los próximos {daysForward} días
          {daysBack > 0
            ? ` (también se revisan los ${daysBack} días anteriores al calendario).`
            : "."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MatchHero match={hero} />

      {rest.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground">Próximamente</h2>
          <div className="space-y-2">
            {rest.map((match) => (
              <MatchCard key={fixtureUiKey(match)} match={match} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export { UPCOMING_QUERY_KEY }
