"use client"

import { useEffect, useState } from "react"

import { formatTimeLeft } from "@/lib/utils"

export function Countdown({ matchDate }: { matchDate: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    function update() {
      const ms = new Date(matchDate).getTime() - Date.now()
      setTimeLeft(ms > 0 ? formatTimeLeft(ms) : "Kick off!")
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [matchDate])

  return <span>{timeLeft}</span>
}
