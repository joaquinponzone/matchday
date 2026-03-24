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
    <div className="flex gap-2">
      <Select defaultValue={params.get("channel") ?? "all"} onValueChange={(v) => set("channel", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All channels</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="telegram">Telegram</SelectItem>
          <SelectItem value="in_app">In-app</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={params.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="read">Read</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
