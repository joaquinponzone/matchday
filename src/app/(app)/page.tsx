import { DashboardFeed } from "@/components/dashboard-feed"
import { RefreshButton } from "@/components/refresh-button"
import { verifySession } from "@/lib/dal"
import { getSettings } from "@/server/db/queries"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { userId } = await verifySession()
  const settings = await getSettings(userId)
  const timezone = settings?.timezone ?? "UTC"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-muted-foreground">Próximo partido</h1>
        <RefreshButton />
      </div>
      <DashboardFeed timezone={timezone} />
    </div>
  )
}
