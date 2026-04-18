"use client"

import { useCallback, useState } from "react"

import { BellIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatNotificationTimestamp } from "@/lib/utils"
import type { Notification } from "@/server/db/schema"

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  in_app: "En la app",
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sent: "default",
  read: "secondary",
  failed: "destructive",
}

interface NotificationPopoverProps {
  unread: number
}

export function NotificationPopover({ unread }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(unread)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) fetchNotifications()
  }

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: "read", readAt: new Date().toISOString() } : n,
      ),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    const unreadInApp = notifications.filter(
      (n) => n.channel === "in_app" && n.status === "sent",
    )
    await Promise.all(
      unreadInApp.map((n) =>
        fetch(`/api/notifications/${n.id}`, { method: "PATCH" }),
      ),
    )
    setNotifications((prev) =>
      prev.map((n) =>
        n.channel === "in_app" && n.status === "sent"
          ? { ...n, status: "read", readAt: new Date().toISOString() }
          : n,
      ),
    )
    setUnreadCount(0)
  }

  const hasUnreadInApp = notifications.some(
    (n) => n.channel === "in_app" && n.status === "sent",
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
          <BellIcon className="size-5 md:hidden" />
          <span className="hidden md:block text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <Badge className="h-3 min-w-3 px-1 text-[8px] bg-sky-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <span className="min-w-0 shrink text-sm font-medium leading-none">
            Notificaciones
          </span>
          {hasUnreadInApp && (
            <button
              type="button"
              onClick={markAllRead}
              className="shrink-0 whitespace-nowrap text-left text-xs leading-none text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay notificaciones.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {CHANNEL_LABELS[n.channel] ?? n.channel}
                      </Badge>
                      <Badge
                        variant={STATUS_VARIANTS[n.status] ?? "outline"}
                        className="text-[10px]"
                      >
                        {n.status}
                      </Badge>
                      {n.sentAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatNotificationTimestamp(n.sentAt)}
                        </span>
                      )}
                    </div>
                    {n.error && (
                      <p className="mt-1 text-[10px] text-destructive">
                        {n.error}
                      </p>
                    )}
                    {n.promiedosFixtureUrl && (
                      <a
                        href={n.promiedosFixtureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-[10px] text-sky-600 underline"
                      >
                        Abrir en Promiedos
                      </a>
                    )}
                  </div>
                  {n.channel === "in_app" && n.status === "sent" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => markRead(n.id)}
                    >
                      Leída
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
