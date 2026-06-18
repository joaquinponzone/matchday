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
      <div className="mx-auto flex w-full items-center justify-between gap-6 px-4 py-3 xl:max-w-[70%]">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-medium text-blue-300">
            ⚽️ <span className="hidden md:inline">Dia de partido</span>
          </Link>
        </div>
        <NavLinks unread={unread} role={role} />
      </div>
    </nav>
  )
}
