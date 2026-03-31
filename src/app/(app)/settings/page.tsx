export const dynamic = "force-dynamic"

import { SettingsForm } from "@/components/settings-form"
import { getUser } from "@/lib/dal"
import { getFollowedTeamsWithMeta, getSettings } from "@/server/db/queries"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const user = await getUser()
  const [settings, followedTeams] = await Promise.all([
    getSettings(user.id),
    getFollowedTeamsWithMeta(user.id),
  ])

  if (!settings) {
    return (
      <p className="text-muted-foreground">
        Configuración no inicializada. Ejecutá <code>bun run db:seed</code>.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text- font-medium text-muted-foreground">Configuración</h1>
      <Separator />
      <SettingsForm settings={settings} followedTeams={followedTeams} userName={user.name} />
    </div>
  )
}
