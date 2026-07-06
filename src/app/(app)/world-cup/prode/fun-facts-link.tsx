"use client"

import { Sparkles } from "lucide-react"
import { useWcTabs } from "../wc-tabs-context"

// Link del Ranking hacia la sub-tab de Curiosidades (vive en la tab
// Estadísticas). No navega de URL: conmuta las tabs vía el contexto compartido.
export function FunFactsLink() {
  const { goToFacts } = useWcTabs()
  return (
    <button
      type="button"
      onClick={goToFacts}
      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:cursor-pointer"
    >
      <Sparkles className="size-3.5" />
      Curiosidades
    </button>
  )
}
