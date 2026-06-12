"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { syncProdeResultsAction } from "./actions"
import { Loader2, RefreshCw } from "lucide-react"

export function SyncResultsButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await syncProdeResultsAction()
      if ("success" in result) {
        setMessage(`✓ ${result.calculated} partido(s) procesado(s)`)
      } else {
        setMessage(result.error ?? "Error al sincronizar")
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={handleSync}
        className="text-xs"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Sincronizar resultados
      </Button>
      {message && (
        <span className="text-[11px] text-muted-foreground">{message}</span>
      )}
    </div>
  )
}
