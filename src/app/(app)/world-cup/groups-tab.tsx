"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function GroupsTab({
  standingsContent,
  matchesContent,
}: {
  standingsContent: React.ReactNode
  matchesContent: React.ReactNode
}) {
  return (
    <Tabs defaultValue="standings">
      <TabsList>
        <TabsTrigger value="standings">Posiciones</TabsTrigger>
        <TabsTrigger value="matches">Partidos</TabsTrigger>
      </TabsList>
      <TabsContent value="standings" className="mt-4">
        {standingsContent}
      </TabsContent>
      <TabsContent value="matches" className="mt-4">
        {matchesContent}
      </TabsContent>
    </Tabs>
  )
}
