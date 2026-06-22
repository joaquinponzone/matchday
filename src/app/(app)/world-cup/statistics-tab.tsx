"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StatisticsTab({
  teamContent,
  playerContent,
}: {
  teamContent: React.ReactNode
  playerContent: React.ReactNode
}) {
  return (
    <Tabs defaultValue="teams">
      <TabsList>
        <TabsTrigger value="teams">Por equipos</TabsTrigger>
        <TabsTrigger value="players">Por jugador</TabsTrigger>
      </TabsList>
      <TabsContent value="teams" className="mt-4">
        {teamContent}
      </TabsContent>
      <TabsContent value="players" className="mt-4">
        {playerContent}
      </TabsContent>
    </Tabs>
  )
}
