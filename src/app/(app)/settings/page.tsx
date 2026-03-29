export const dynamic = "force-dynamic"

import { SettingsForm } from "@/components/settings-form"
import { verifySession } from "@/lib/dal"
import { getFollowedTeamsWithMeta, getSettings } from "@/server/db/queries"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const { userId } = await verifySession()
  const [settings, followedTeams] = await Promise.all([
    getSettings(userId),
    getFollowedTeamsWithMeta(userId),
  ])

  if (!settings) {
    return (
      <p className="text-muted-foreground">
        Settings not initialized. Run <code>bun run db:seed</code>.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text- font-medium text-muted-foreground">Settings</h1>
      <Separator />
      <SettingsForm settings={settings} followedTeams={followedTeams} />
    </div>
  )
}
