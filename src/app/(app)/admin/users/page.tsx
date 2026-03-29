export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/dal"
import { getAllUsers } from "@/server/db/queries"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { ToggleUserStatusButton } from "./deactivate-user-button"

export default async function AdminUsersPage() {
  await requireAdmin()
  const users = await getAllUsers()

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-muted-foreground">Users Management</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <UserActions user={user} />
              <ToggleUserStatusButton user={user} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
