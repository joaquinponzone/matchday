"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// El world-cup aprovecha todo el ancho (rankings/grillas); el resto de las
// páginas mantiene el ancho ajustado al contenido (w-fit) como antes.
export function MainContainer({ children }: { children: React.ReactNode }) {
  const wide = usePathname()?.startsWith("/world-cup")

  return (
    <main
      className={cn(
        "mx-auto max-w-full flex-1 px-4 py-6 lg:max-w-[90%]",
        wide ? "w-full" : "w-fit"
      )}
    >
      {children}
    </main>
  )
}
