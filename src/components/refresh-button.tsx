"use client"

import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { useTransition } from "react"

import { UPCOMING_QUERY_KEY } from "@/components/dashboard-feed"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await queryClient.invalidateQueries({ queryKey: [...UPCOMING_QUERY_KEY] })
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Actualizar partidos"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
    </Button>
  )
}
