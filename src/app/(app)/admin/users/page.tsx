export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/dal"
import { getAllUsers } from "@/server/db/queries"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { ToggleUserStatusButton } from "./deactivate-user-button"
import { DeleteUserButton } from "./delete-user-button"
import clsx from "clsx"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default async function AdminUsersPage() {
  await requireAdmin()
  const users = await getAllUsers()
  const systemAdminUserId = process.env.ADMIN_EMAIL ?? ""

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-muted-foreground">Gestión de usuarios</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={clsx("font-medium truncate", user.email === systemAdminUserId ? "text-blue-300" : "")}>{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <UserActions user={user} systemAdminUserId={systemAdminUserId} />
              <div className="flex items-center gap-2">
                {user.email !== systemAdminUserId ? (
                  <>
                    <DeleteUserButton user={user} />
                    {(user.status === "active" || user.status === "inactive") && (
                      <ToggleUserStatusButton user={user} />
                    )}
                  </>
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs bg-blue-400/40 text-white" disabled>
                    <Shield className="size-4" />
                    Admin del sistema
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
