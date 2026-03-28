"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { approveUser, rejectUser, changeRole } from "./actions"
import type { User } from "@/server/db/schema"

export function UserActions({ user }: { user: Pick<User, "id" | "role" | "status"> }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      {user.status === "pending" && (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={pending}
            onClick={() => startTransition(() => approveUser(user.id))}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => rejectUser(user.id))}
          >
            Reject
          </Button>
        </>
      )}
      {user.status === "active" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              changeRole(user.id, user.role === "admin" ? "user" : "admin"),
            )
          }
        >
          {user.role === "admin" ? "Remove admin" : "Make admin"}
        </Button>
      )}
      {user.status === "rejected" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => approveUser(user.id))}
        >
          Approve
        </Button>
      )}
    </div>
  )
}
