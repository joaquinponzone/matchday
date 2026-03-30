"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WcTabsProps {
  standingsContent: React.ReactNode
  matchesContent: React.ReactNode
  bracketContent: React.ReactNode
}

export function WcTabs({ standingsContent, matchesContent, bracketContent }: WcTabsProps) {
  return (
    <Tabs defaultValue="standings">
      <TabsList className="w-full">
        <TabsTrigger value="standings" className="flex-1">Posiciones</TabsTrigger>
        <TabsTrigger value="matches" className="flex-1">Partidos</TabsTrigger>
        <TabsTrigger value="bracket" className="flex-1">Llave</TabsTrigger>
      </TabsList>
      <TabsContent value="standings" className="mt-4">
        {standingsContent}
      </TabsContent>
      <TabsContent value="matches" className="mt-4">
        {matchesContent}
      </TabsContent>
      <TabsContent value="bracket" className="mt-4">
        {bracketContent}
      </TabsContent>
    </Tabs>
  )
}
