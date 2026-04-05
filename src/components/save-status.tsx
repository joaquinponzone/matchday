import { Loader2 } from "lucide-react"

interface SaveStatusProps {
  isSaving: boolean
  saved: boolean
}

export function SaveStatus({ isSaving, saved }: SaveStatusProps) {
  if (isSaving)
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Guardando...
      </div>
    )
  if (saved) return <p className="text-xs text-green-500">Guardado ✓</p>
  return null
}
