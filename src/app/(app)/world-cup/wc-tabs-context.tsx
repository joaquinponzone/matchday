"use client"

import { createContext, useContext, useState } from "react"

// Estado compartido de las tabs del World Cup. La tab principal (Prode / Grupos
// / Llave / Estadísticas) y la sub-tab de Estadísticas (Curiosidades / equipos
// / jugador) se controlan desde acá para poder navegar entre ellas desde
// cualquier lado del árbol (ej. un link en el Ranking que lleva a Curiosidades).
interface WcTabsContextValue {
  mainTab: string
  setMainTab: (value: string) => void
  statsTab: string
  setStatsTab: (value: string) => void
  goToFacts: () => void
}

const WcTabsContext = createContext<WcTabsContextValue | null>(null)

export function useWcTabs() {
  const ctx = useContext(WcTabsContext)
  if (!ctx) throw new Error("useWcTabs debe usarse dentro de WcTabsProvider")
  return ctx
}

export function WcTabsProvider({ children }: { children: React.ReactNode }) {
  const [mainTab, setMainTab] = useState("prode")
  const [statsTab, setStatsTab] = useState("facts")

  const goToFacts = () => {
    setStatsTab("facts")
    setMainTab("statistics")
    // Traer las tabs al viewport: el Ranking puede estar scrolleado abajo.
    document
      .getElementById("world-cup-tabs")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <WcTabsContext.Provider
      value={{ mainTab, setMainTab, statsTab, setStatsTab, goToFacts }}
    >
      {children}
    </WcTabsContext.Provider>
  )
}
