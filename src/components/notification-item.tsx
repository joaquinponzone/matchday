"use client"

import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/server/db/schema"

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  in_app: "In-app",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  read: "secondary",
  failed: "destructive",
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()

  async function markRead() {
    await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" })
    router.refresh()
  }

  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{notification.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {CHANNEL_LABELS[notification.channel] ?? notification.channel}
          </Badge>
          <Badge
            variant={STATUS_VARIANTS[notification.status] ?? "outline"}
            className="text-[10px]"
          >
            {notification.status}
          </Badge>
          {notification.sentAt && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(notification.sentAt).toLocaleString()}
            </span>
          )}
        </div>
        {notification.error && (
          <p className="mt-1 text-[10px] text-destructive">{notification.error}</p>
        )}
      </div>
      {notification.channel === "in_app" && notification.status === "sent" && (
        <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={markRead}>
          Mark read
        </Button>
      )}
    </div>
  )
}
