"use client"

import Image from "next/image"
import { useCallback, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { TEAM_META } from "@/lib/teams"
import { toggleTeam, testTelegramNotification } from "@/app/(app)/settings/actions"
import type { Settings } from "@/server/db/schema"

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Lisbon",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
]

async function saveSettings(data: Partial<Settings>) {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export function SettingsForm({ settings, followedTeams }: { settings: Settings; followedTeams: string[] }) {
  const [values, setValues] = useState(settings)
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  const persist = useDebounce(useCallback((data: Partial<Settings>) => {
    saveSettings(data)
  }, []), 600)

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    persist({ [key]: value })
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Followed Teams</h2>
        {Object.values(TEAM_META).map((team) => (
          <div key={team.key} className="flex items-center gap-3">
            <Image
              src={team.crestUrl}
              alt={team.name}
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-medium">{team.name}</span>
            <Switch
              className="ml-auto"
              checked={followedTeams.includes(team.key)}
              onCheckedChange={(v) => toggleTeam(team.key, v)}
            />
          </div>
        ))}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Timezone</h2>
        <Select
          value={values.timezone}
          onValueChange={(v) => update("timezone", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Channels</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>In-app notifications</Label>
            <Switch
              checked={Boolean(values.inAppEnabled)}
              onCheckedChange={(v) => update("inAppEnabled", v ? 1 : 0)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Telegram</Label>
              <div className="flex items-center gap-2">
                {values.telegramEnabled && values.telegramChatId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await testTelegramNotification()
                        setTestResult(result)
                        setTimeout(() => setTestResult(null), 4000)
                      })
                    }
                  >
                    {isPending ? "Sending…" : "Test"}
                  </Button>
                ) : null}
                <Switch
                  checked={Boolean(values.telegramEnabled)}
                  onCheckedChange={(v) => {
                    update("telegramEnabled", v ? 1 : 0)
                    setTestResult(null)
                  }}
                />
              </div>
            </div>
            {testResult ? (
              <p className={cn("text-xs", testResult.ok ? "text-green-500" : "text-destructive")}>
                {testResult.ok ? "Message sent!" : testResult.error}
              </p>
            ) : null}
            {values.telegramEnabled ? (
              <Input
                placeholder="Telegram Chat ID"
                value={values.telegramChatId ?? ""}
                onChange={(e) => update("telegramChatId", e.target.value)}
              />
            ) : null}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Notification timing</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Runs once daily at 8:00 AM (Argentina time)</p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Day before match</Label>
          <Switch
            checked={Boolean(values.notifyDayBefore)}
            onCheckedChange={(v) => update("notifyDayBefore", v ? 1 : 0)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Match day</Label>
          <Switch
            checked={Boolean(values.notifyMatchDay)}
            onCheckedChange={(v) => update("notifyMatchDay", v ? 1 : 0)}
          />
        </div>
      </section>
    </div>
  )
}
