"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NotificationFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === "all") {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    router.push(`/notifications?${next.toString()}`)
  }

  return (
    <div className="flex gap-2 w-full">
      <Select defaultValue={params.get("channel") ?? "all"} onValueChange={(v) => set("channel", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los canales</SelectItem>
          <SelectItem value="telegram">Telegram</SelectItem>
          <SelectItem value="in_app">En la app</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={params.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="sent">Enviada</SelectItem>
          <SelectItem value="read">Leída</SelectItem>
          <SelectItem value="failed">Fallida</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
