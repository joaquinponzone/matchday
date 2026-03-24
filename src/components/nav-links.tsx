"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/logout"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/upcoming-matches", label: "Upcoming", exact: false },
  { href: "/notifications", label: "Notifications", exact: false },
  { href: "/settings", label: "Settings", exact: false },
]

export function NavLinks({ unread }: { unread: number }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-1 items-center gap-4 text-sm">
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-foreground",
              active ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {label}
            {label === "Notifications" && unread > 0 && (
              <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                {unread}
              </Badge>
            )}
          </Link>
        )
      })}
      <form action={logout} className="ml-auto">
        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
          Logout
        </Button>
      </form>
    </div>
  )
}
