"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  weeks: number
  days: number
  hours: number
  minutes: number
}

function computeTimeLeft(targetDate: string): TimeLeft | null {
  const ms = new Date(targetDate).getTime() - Date.now()
  if (ms <= 0) return null

  const totalMinutes = Math.floor(ms / 60000)
  const minutes = totalMinutes % 60
  const totalHours = Math.floor(totalMinutes / 60)
  const hours = totalHours % 24
  const totalDays = Math.floor(totalHours / 24)
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays % 7

  return { weeks, days, hours, minutes }
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-bold tabular-nums sm:text-5xl md:text-6xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  )
}

interface WorldCupCountdownProps {
  targetDate: string
  firstMatchLabel?: string
}

export function WorldCupCountdown({
  targetDate,
  firstMatchLabel,
}: WorldCupCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    computeTimeLeft(targetDate),
  )

  useEffect(() => {
    const update = () => setTimeLeft(computeTimeLeft(targetDate))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) {
    return (
      <div className="py-4 text-center">
        <p className="text-lg font-semibold">¡El Mundial ha comenzado!</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card px-6 py-5 text-card-foreground shadow-sm">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Faltan
      </p>
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        <CountdownBlock value={timeLeft.weeks} label="semanas" />
        <Separator />
        <CountdownBlock value={timeLeft.days} label="días" />
        <Separator />
        <CountdownBlock value={timeLeft.hours} label="horas" />
        <Separator />
        <CountdownBlock value={timeLeft.minutes} label="min" />
      </div>
      {firstMatchLabel && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {firstMatchLabel}
        </p>
      )}
    </div>
  )
}

function Separator() {
  return (
    <span className="mt-2 text-2xl font-light text-muted-foreground/40 sm:text-3xl md:mt-3 md:text-4xl">
      :
    </span>
  )
}
