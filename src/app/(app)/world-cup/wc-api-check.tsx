"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkWcApiStatus } from "./actions"

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; count: number; firstMatch: string | null }
  | { state: "error"; message: string }

export function WcApiCheck() {
  const [status, setStatus] = useState<Status>({ state: "idle" })

  async function handleCheck() {
    setStatus({ state: "loading" })
    try {
      const result = await checkWcApiStatus()
      setStatus({ state: "done", ...result })
    } catch (e) {
      setStatus({
        state: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCheck}
          disabled={status.state === "loading"}
        >
          {status.state === "loading" ? "Checking…" : "Check API"}
        </Button>
        {status.state === "done" && (
          <span className="text-sm text-muted-foreground">
            {status.count > 0
              ? `${status.count} matches found — first: ${status.firstMatch}`
              : "No data yet (0 matches)"}
          </span>
        )}
        {status.state === "error" && (
          <span className="text-sm text-destructive">{status.message}</span>
        )}
      </CardContent>
    </Card>
  )
}
