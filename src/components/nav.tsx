import Link from "next/link"

import { getUser } from "@/lib/dal"
import { getUnreadCount } from "@/server/db/queries"
import { NavLinks } from "@/components/nav-links"

export async function Nav() {
  let unread = 0
  let role = "user"
  try {
    const user = await getUser()
    role = user.role
    unread = await getUnreadCount(user.id)
  } catch {
    // DB not reachable during build or before setup
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-2xl md:max-w-4xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-medium text-xl text-blue-300">
          Matchday ⚽️
        </Link>
        <NavLinks unread={unread} role={role} />
      </div>
    </nav>
  )
}
