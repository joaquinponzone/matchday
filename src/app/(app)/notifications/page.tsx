export const dynamic = "force-dynamic"

import { Suspense } from "react"

import { NotificationFilters } from "@/components/notification-filters"
import { NotificationItem } from "@/components/notification-item"
import { verifySession } from "@/lib/dal"
import { getNotifications } from "@/server/db/queries"

interface PageProps {
  searchParams: Promise<{ channel?: string; status?: string }>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const { userId } = await verifySession()
  const { channel, status } = await searchParams
  const notifications = await getNotifications(userId, { channel, status })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-muted-foreground">Notificaciones</h1>
      </div>

      <Suspense>
        <NotificationFilters />
      </Suspense>

      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay notificaciones.</p>
      ) : (
        <div>
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
