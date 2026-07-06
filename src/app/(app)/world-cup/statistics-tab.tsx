"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWcTabs } from "./wc-tabs-context"

export function StatisticsTab({
  teamContent,
  playerContent,
  funFactsContent,
}: {
  teamContent: React.ReactNode
  playerContent: React.ReactNode
  funFactsContent: React.ReactNode
}) {
  const { statsTab, setStatsTab } = useWcTabs()
  return (
    <Tabs value={statsTab} onValueChange={setStatsTab}>
      <TabsList>
        <TabsTrigger value="facts">Curiosidades</TabsTrigger>
        <TabsTrigger value="teams">Por equipos</TabsTrigger>
        <TabsTrigger value="players">Por jugador</TabsTrigger>
      </TabsList>
      <TabsContent value="facts" className="mt-4">
        {funFactsContent}
      </TabsContent>
      <TabsContent value="teams" className="mt-4">
        {teamContent}
      </TabsContent>
      <TabsContent value="players" className="mt-4">
        {playerContent}
      </TabsContent>
    </Tabs>
  )
}
