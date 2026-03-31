"use client"

import Image from "next/image"
import { useCallback, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { followTeam, unfollowTeam, testTelegramNotification, updateDisplayName } from "@/app/(app)/settings/actions"
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

interface FollowedTeamMeta {
  apiId: number
  name: string
  shortName: string
  crest: string
  enabled: number
}

interface SearchResult {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

async function saveSettings(data: Partial<Settings>) {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export function SettingsForm({
  settings,
  followedTeams,
  userName,
}: {
  settings: Settings
  followedTeams: FollowedTeamMeta[]
  userName: string
}) {
  const [values, setValues] = useState(settings)
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  const [displayName, setDisplayName] = useState(userName)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [followed, setFollowed] = useState(followedTeams)
  const searchRef = useRef<HTMLDivElement>(null)

  const followedIds = new Set(followed.map((t) => t.apiId))

  const persist = useDebounce(useCallback((data: Partial<Settings>) => {
    saveSettings(data)
  }, []), 600)

  const persistName = useDebounce(useCallback((name: string) => {
    updateDisplayName(name)
  }, []), 600)

  const doSearch = useDebounce(useCallback(async (q: string) => {
    if (q.length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.teams ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, []), 400)

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    persist({ [key]: value })
  }

  async function handleFollow(team: SearchResult) {
    setFollowed((prev) => [
      ...prev,
      { apiId: team.id, name: team.name, shortName: team.shortName, crest: team.crest, enabled: 1 },
    ])
    setSearchQuery("")
    setSearchResults([])
    await followTeam(team.id, team.name, team.shortName, team.tla, team.crest)
  }

  async function handleUnfollow(apiId: number) {
    setFollowed((prev) => prev.filter((t) => t.apiId !== apiId))
    await unfollowTeam(apiId)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Equipos seguidos</h2>

          <div ref={searchRef} className="relative">
            <Input
              placeholder="Buscar equipos..."
              value={searchQuery}
              onChange={(e) => {
                const q = e.target.value
                setSearchQuery(q)
                doSearch(q)
              }}
            />
            {(searchResults.length > 0 || isSearching) && searchQuery.length >= 3 && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
                {isSearching ? (
                  <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
                ) : (
                  searchResults.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 hover:bg-accent"
                    >
                      {team.crest && (
                        <Image
                          src={team.crest}
                          alt={team.name}
                          width={24}
                          height={24}
                          className="shrink-0 object-contain"
                        />
                      )}
                      <span className="flex-1 text-sm">{team.name}</span>
                      {followedIds.has(team.id) ? (
                        <span className="text-xs text-muted-foreground">Siguiendo</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollow(team)}
                        >
                          Seguir
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {followed.map((team) => (
            <div key={team.apiId} className="flex items-center gap-3">
              {team.crest && (
                <Image
                  src={team.crest}
                  alt={team.name}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              )}
              <span className="flex-1 font-medium">{team.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleUnfollow(team.apiId)}
              >
                Quitar
              </Button>
            </div>
          ))}

          {followed.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no seguís ningún equipo. Buscá uno para agregar.</p>
          )}


        </section>

        <Separator />
      </div>
      <div className="space-y-6 lg:border-l lg:pl-4">
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Nombre</h2>
          <Input
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              persistName(e.target.value)
            }}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Zona horaria</h2>
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
          <h2 className="text-sm font-medium">Canales</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Notificaciones en la app</Label>
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
                      {isPending ? "Enviando..." : "Probar"}
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
                  {testResult.ok ? "¡Mensaje enviado!" : testResult.error}
                </p>
              ) : null}
              {values.telegramEnabled ? (
                <div className="space-y-1">
                  <Input
                    placeholder="ID de chat de Telegram"
                    value={values.telegramChatId ?? ""}
                    onChange={(e) => update("telegramChatId", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Escribile a @userinfobot en Telegram y enviá /start para obtener tu ID de chat.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Momento de notificación</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Se ejecuta una vez al día a las 8:00 AM (hora Argentina)</p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Día anterior al partido</Label>
            <Switch
              checked={Boolean(values.notifyDayBefore)}
              onCheckedChange={(v) => update("notifyDayBefore", v ? 1 : 0)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Día del partido</Label>
            <Switch
              checked={Boolean(values.notifyMatchDay)}
              onCheckedChange={(v) => update("notifyMatchDay", v ? 1 : 0)}
            />
          </div>
        </section>
      </div>
    </div>

  )
}
