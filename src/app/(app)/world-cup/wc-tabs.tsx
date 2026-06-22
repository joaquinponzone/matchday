"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WcTabsProps {
  standingsContent: React.ReactNode
  bracketContent: React.ReactNode
  prodeContent: React.ReactNode
  statisticsContent: React.ReactNode
}

export function WcTabs({
  standingsContent,
  bracketContent,
  prodeContent,
  statisticsContent,
}: WcTabsProps) {
  return (
    <Tabs defaultValue="prode">
      <TabsList className="w-full">
        <TabsTrigger value="prode" className="flex-1 text-xs sm:text-sm">
          Prode
        </TabsTrigger>
        <TabsTrigger value="standings" className="flex-1 text-xs sm:text-sm">
          Grupos
        </TabsTrigger>
        <TabsTrigger value="bracket" className="flex-1 text-xs sm:text-sm">
          Llave
        </TabsTrigger>
        <TabsTrigger value="statistics" className="flex-1 text-xs sm:text-sm">
          Estadísticas
        </TabsTrigger>
      </TabsList>
      <TabsContent value="prode" className="mt-4">
        {prodeContent}
      </TabsContent>
      <TabsContent value="standings" className="mt-4">
        {standingsContent}
      </TabsContent>
      <TabsContent value="bracket" className="mt-4">
        {bracketContent}
      </TabsContent>
      <TabsContent value="statistics" className="mt-4">
        {statisticsContent}
      </TabsContent>
    </Tabs>
  )
}
