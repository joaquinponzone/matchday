"use client"

import Image from "next/image"
import { useCallback, useRef, useState, useTransition } from "react"

import { SaveStatus } from "@/components/save-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { followTeam, unfollowTeam, testTelegramNotification, updateDisplayName, updateNickname } from "@/app/(app)/settings/actions"
import { useDebounce } from "@/hooks/use-debounce"
import { useSaveStatus } from "@/hooks/use-save-status"
import { cn } from "@/lib/utils"
import type { Settings } from "@/server/db/schema"
import { Loader2 } from "lucide-react"

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
  userNickname,
}: {
  settings: Settings
  followedTeams: FollowedTeamMeta[]
  userName: string
  userNickname: string
}) {
  const [values, setValues] = useState(settings)
  const [isPending, startTransition] = useTransition()
  const [isTeamSyncing, startTeamTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  const [displayName, setDisplayName] = useState(userName)
  const [nickname, setNickname] = useState(userNickname)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [followed, setFollowed] = useState(followedTeams)
  const searchRef = useRef<HTMLDivElement>(null)

  const nameStatus = useSaveStatus()
  const nicknameStatus = useSaveStatus()
  const timezoneStatus = useSaveStatus()
  const inAppStatus = useSaveStatus()
  const telegramToggleStatus = useSaveStatus()
  const telegramChatIdStatus = useSaveStatus()
  const notificationsStatus = useSaveStatus()

  const followedIds = new Set(followed.map((t) => t.apiId))

  const persistName = useDebounce(useCallback(async (name: string) => {
    await nameStatus.wrap(() => updateDisplayName(name))
  }, [nameStatus]), 1000)

  const persistNickname = useDebounce(useCallback(async (value: string) => {
    const result = await nicknameStatus.wrap(() => updateNickname(value))
    if (!result.ok) setNicknameError(result.error ?? "Error al guardar.")
    else setNicknameError(null)
  }, [nicknameStatus]), 1000)

  const persistTimezone = useDebounce(useCallback(async (data: Partial<Settings>) => {
    await timezoneStatus.wrap(() => saveSettings(data))
  }, [timezoneStatus]), 1000)

  const persistInApp = useDebounce(useCallback(async (data: Partial<Settings>) => {
    await inAppStatus.wrap(() => saveSettings(data))
  }, [inAppStatus]), 1000)

  const persistTelegramToggle = useDebounce(useCallback(async (data: Partial<Settings>) => {
    await telegramToggleStatus.wrap(() => saveSettings(data))
  }, [telegramToggleStatus]), 1000)

  const persistTelegramChatId = useDebounce(useCallback(async (data: Partial<Settings>) => {
    await telegramChatIdStatus.wrap(() => saveSettings(data))
  }, [telegramChatIdStatus]), 1000)

  const persistNotifications = useDebounce(useCallback(async (data: Partial<Settings>) => {
    await notificationsStatus.wrap(() => saveSettings(data))
  }, [notificationsStatus]), 1000)

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

  function updateWith<K extends keyof Settings>(key: K, value: Settings[K], persist: (data: Partial<Settings>) => void) {
    setValues((prev) => ({ ...prev, [key]: value }))
    persist({ [key]: value })
  }

  function handleFollow(team: SearchResult) {
    setFollowed((prev) => [
      ...prev,
      { apiId: team.id, name: team.name, shortName: team.shortName, crest: team.crest, enabled: 1 },
    ])
    setSearchQuery("")
    setSearchResults([])
    startTeamTransition(async () => {
      await followTeam(team.id, team.name, team.shortName, team.tla, team.crest)
    })
  }

  function handleUnfollow(apiId: number) {
    setFollowed((prev) => prev.filter((t) => t.apiId !== apiId))
    startTeamTransition(async () => {
      await unfollowTeam(apiId)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:w-4xl mx-auto">
      <div className="space-y-6">
        <section className="relative space-y-3 p-3">
          <h2 className="text-sm font-medium italic border-b border-blue-300 pb-2 w-fit">🏆 Equipos seguidos</h2>

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
                disabled={isTeamSyncing}
                onClick={() => handleUnfollow(team.apiId)}
              >
                Quitar
              </Button>
            </div>
          ))}

          {followed.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no seguís ningún equipo. Buscá uno para agregar.</p>
          )}

          <div ref={searchRef} className="relative">
            <Input
              placeholder="Agregá más equipos para seguir..."
              value={searchQuery}
              disabled={isTeamSyncing}
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
                    <div key={team.id} className="flex items-center gap-3 p-3 hover:bg-accent">
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
                          disabled={isTeamSyncing}
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

          {isTeamSyncing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                Sincronizando partidos...
              </div>
            </div>
          )}
        </section>

        <Separator />
      </div>

      <div className="space-y-6 lg:border-l lg:pl-4">
        <section className="space-y-3">
          <h2 className="text-sm font-medium italic border-b border-blue-300 pb-2 w-fit">👤 Información personal</h2>

          <h2 className="text-sm font-medium">Nombre</h2>
          <Input
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              persistName(e.target.value)
            }}
          />
          <SaveStatus {...nameStatus} />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">Nickname</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tu nombre público en los rankings de Matchday. Único por usuario.
            </p>
          </div>
          <div className="space-y-1">
            <Input
              placeholder="ej: gordo_del_gol"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setNicknameError(null)
                persistNickname(e.target.value)
              }}
            />
            {nicknameError ? (
              <p className="text-xs text-destructive">{nicknameError}</p>
            ) : nicknameStatus.isSaving || nicknameStatus.saved ? (
              <SaveStatus {...nicknameStatus} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Solo letras, números y _ (3-20 caracteres).
              </p>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Zona horaria</h2>
          <Select
            value={values.timezone}
            onValueChange={(v) => updateWith("timezone", v, persistTimezone)}
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
          <SaveStatus {...timezoneStatus} />
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-sm font-medium italic border-b border-blue-300 pb-2 w-fit">📣 Canales de aviso</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Notificaciones en la app</Label>
              <Switch
                checked={Boolean(values.inAppEnabled)}
                onCheckedChange={(v) => updateWith("inAppEnabled", v ? 1 : 0, persistInApp)}
              />
            </div>
            <SaveStatus {...inAppStatus} />
            <p className="text-xs text-muted-foreground">
              Cuando actives esta opción, te van a llegar notificaciones en la app. Podés verlas en el ícono de la campana en el menú.
            </p>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Telegram</Label>
                <div className="flex items-center gap-2">
                  {Boolean(values.telegramEnabled) && values.telegramChatId && (
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
                  )}
                  <Switch
                    checked={Boolean(values.telegramEnabled)}
                    onCheckedChange={(v) => {
                      updateWith("telegramEnabled", v ? 1 : 0, persistTelegramToggle)
                      setTestResult(null)
                    }}
                  />
                </div>
              </div>
              <SaveStatus {...telegramToggleStatus} />
              {testResult && (
                <p className={cn("text-xs", testResult.ok ? "text-green-500" : "text-destructive")}>
                  {testResult.ok ? "¡Mensaje enviado!" : testResult.error}
                </p>
              )}
              {Boolean(values.telegramEnabled) && (
                <div className="space-y-2">
                  <Input
                    placeholder="ID de chat de Telegram"
                    value={values.telegramChatId ?? ""}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, telegramChatId: e.target.value }))
                      persistTelegramChatId({ telegramChatId: e.target.value })
                    }}
                  />
                  <SaveStatus {...telegramChatIdStatus} />
                  <p className="text-xs text-muted-foreground">
                    Para recibir notificaciones de nuestro bot, presentáte primero.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    1. Buscalo en Telegram como <span className="font-medium font-bold text-foreground">@matchday_notifications_bot</span> y mandale un mensaje con <span className="font-medium italic text-foreground">"/start"</span>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    2. Después de eso, escribile a <span className="font-medium font-bold text-foreground">@userinfobot</span> para obtener tu ID de chat y pegalo acá arriba.
                  </p>
                </div>
              )}
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
              onCheckedChange={(v) => updateWith("notifyDayBefore", v ? 1 : 0, persistNotifications)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Día del partido</Label>
            <Switch
              checked={Boolean(values.notifyMatchDay)}
              onCheckedChange={(v) => updateWith("notifyMatchDay", v ? 1 : 0, persistNotifications)}
            />
          </div>

          <SaveStatus {...notificationsStatus} />
        </section>
      </div>
    </div>
  )
}
