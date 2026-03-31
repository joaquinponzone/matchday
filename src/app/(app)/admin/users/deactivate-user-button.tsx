"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { activateUser, deactivateUser } from "@/server/db/queries"
import { CircleCheck, CircleX, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import type { User } from "@/server/db/schema"

export function ToggleUserStatusButton({ user }: { user: Pick<User, "id" | "status"> }) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()
    const userId = user.id
    const status = user.status
    const isActive = status === "active"

    const toggleUserStatus = async () => {
        startTransition(async () => {
            if (status === "active") {
                await deactivateUser(userId)
            } else {
                await activateUser(userId)
            }
        })
        setOpen(false)
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={pending} className="text-xs">
                    {pending ? <Loader2 className="size-4 animate-spin" /> : isActive ? <CircleX className="size-4" /> : <CircleCheck className="size-4" />}
                    {isActive ? "Desactivar" : "Activar"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isActive ? "Desactivar" : "Activar"} usuario</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    ¿Estás seguro que querés {isActive ? "desactivar" : "activar"} este usuario?
                </DialogDescription>
                <DialogFooter showCloseButton={true}>
                    <Button variant="destructive" onClick={toggleUserStatus} disabled={pending}>{isActive ? "Desactivar" : "Activar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}