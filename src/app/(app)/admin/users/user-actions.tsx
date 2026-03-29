"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { approveUser, rejectUser, changeRole } from "./actions"
import type { User } from "@/server/db/schema"
import clsx from "clsx"
import { Loader2, ShieldCheckIcon, ShieldXIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function UserActions({ user, systemAdminUserId }: { user: Pick<User, "id" | "role" | "status" | "email">, systemAdminUserId: string }) {
  const [pending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-2">
      {user.status === "pending" && (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={pending}
            onClick={() => startTransition(() => approveUser(user.id))}
            className="text-xs"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => rejectUser(user.id))}
            className="text-xs"
          >
            Reject
          </Button>
        </>
      )}
      {user.status === "active" && user.email !== systemAdminUserId && (
        <Button
          size="sm"
          variant="ghost"
          className={clsx("bg-muted text-xs", user.role !== "admin" ? "text-teal-400" : "text-red-400")}
          disabled={pending}
          onClick={() =>{
            startTransition(() =>
              changeRole(user.id, user.role === "admin" ? "user" : "admin"),
            )
          }}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : user.role !== "admin" ? <ShieldCheckIcon className="size-4" /> : <ShieldXIcon className="size-4" />}
          {user.role === "admin" ? "Remove admin" : "Make admin"}
        </Button>
      )}
      {user.status === "rejected" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => approveUser(user.id))}
          className="text-xs"
        >
          Approve
        </Button>
      )}
    </div>
  )
}