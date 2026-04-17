import { DashboardFeed } from "@/components/dashboard-feed"
import { RefreshButton } from "@/components/refresh-button"
import { verifySession } from "@/lib/dal"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  await verifySession()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-muted-foreground">Próximo partido</h1>
        <RefreshButton />
      </div>
      <DashboardFeed />
    </div>
  )
}
