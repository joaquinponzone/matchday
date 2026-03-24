import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUnreadCount } from "@/server/db/queries"
import { logout } from "@/app/actions/logout"

export async function Nav() {
  let unread = 0
  try {
    unread = await getUnreadCount()
  } catch {
    // DB not reachable during build or before setup
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-2xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-medium">
          Matchday
        </Link>
        <div className="flex flex-1 items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/upcoming-matches" className="text-muted-foreground hover:text-foreground">
            Upcoming
          </Link>
          <Link
            href="/notifications"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            Notifications
            {unread > 0 && (
              <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                {unread}
              </Badge>
            )}
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
          <form action={logout} className="ml-auto">
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
