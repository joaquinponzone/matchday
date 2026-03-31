import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "0s"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  // if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
  return parts.join(" ")
}

export function formatDate(date: Date | string, timezone?: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(date))
}

export function formatMatchDate(isoDate: string, timezone: string): string {
  const d = new Date(isoDate)
  const date = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(d)
  const time = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(d)
  return `${date}\n${time}`
}

export function formatMatchDateParts(
  isoDate: string,
  timezone: string,
): { date: string; time: string } {
  const d = new Date(isoDate)
  const date = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(d)
  const time = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(d)
  return { date, time }
}

export function isToday(isoDate: string, timezone: string): boolean {
  const matchDay = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(isoDate))
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date())
  return matchDay === today
}

export function isTomorrow(isoDate: string, timezone: string): boolean {
  const matchDay = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(isoDate))
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    new Date(Date.now() + 86400000),
  )
  return matchDay === tomorrow
}

export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text
  return text.slice(0, limit) + "…"
}
