export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/dal"
import { getAllUsers } from "@/server/db/queries"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  rejected: "destructive",
}

export default async function AdminUsersPage() {
  await requireAdmin()
  const users = await getAllUsers()

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-muted-foreground">User management</h1>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="secondary">{user.role}</Badge>
                <Badge variant={statusVariant[user.status] ?? "outline"}>
                  {user.status}
                </Badge>
              </div>
            </div>
            <UserActions user={user} />
          </div>
        ))}
      </div>
    </div>
  )
}
