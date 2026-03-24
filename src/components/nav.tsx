import Link from "next/link"

import { getUnreadCount } from "@/server/db/queries"
import { NavLinks } from "@/components/nav-links"

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
        <NavLinks unread={unread} />
      </div>
    </nav>
  )
}
