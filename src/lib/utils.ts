import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * App-wide display timezone. All users are in Argentina, so we format every
 * date with this zone instead of carrying a per-user `timezone` everywhere.
 */
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "0s"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  return parts.join(" ")
}

export function formatDate(date: Date | string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
    timeZoneName: "short",
  }).format(new Date(date))
  return `${formatted} hs`
}

export function formatMatchDate(isoDate: string): string {
  const d = new Date(isoDate)
  const date = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(d)
  const time = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(d)
  return `${date}\n${time} hs`
}

export function formatMatchDateParts(
  isoDate: string,
): { date: string; time: string } {
  const d = new Date(isoDate)
  const date = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(d)
  const time = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(d)
  return { date, time: `${time} hs` }
}

/** Time of day only, 24h format, for match notifications with a separate day label. */
export function formatMatchTimeOnly(isoDate: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(new Date(isoDate))
}

/** Short date + time for notification history (popover). */
export function formatNotificationTimestamp(isoDate: Date | string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  }).format(new Date(isoDate))
  return `${formatted} hs`
}

export function isToday(isoDate: string): boolean {
  const matchDay = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date(isoDate))
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date())
  return matchDay === today
}

export function isTomorrow(isoDate: string): boolean {
  const matchDay = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date(isoDate))
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(
    new Date(Date.now() + 86400000),
  )
  return matchDay === tomorrow
}

export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text
  return text.slice(0, limit) + "…"
}
