"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteUserAction } from "./actions"
import { Loader2, Trash2 } from "lucide-react"
import type { User } from "@/server/db/schema"

export function DeleteUserButton({ user }: { user: Pick<User, "id" | "status"> }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (user.status !== "inactive") return null

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUserAction(user.id)
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending} className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-400">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Esta acción es irreversible. Se eliminarán todos los datos del usuario: configuración, notificaciones, equipos seguidos y predicciones.
        </DialogDescription>
        <DialogFooter showCloseButton={true}>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            Eliminar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
