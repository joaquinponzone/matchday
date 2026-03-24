export const dynamic = "force-dynamic"

import { SettingsForm } from "@/components/settings-form"
import { getFollowedTeams, getSettings } from "@/server/db/queries"

export default async function SettingsPage() {
  const [settings, followed] = await Promise.all([getSettings(), getFollowedTeams()])

  if (!settings) {
    return (
      <p className="text-muted-foreground">
        Settings not initialized. Run <code>bun run db:seed</code>.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-muted-foreground">Settings</h1>
      <SettingsForm settings={settings} followedTeams={followed} />
    </div>
  )
}
