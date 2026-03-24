"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/logout"
import { cn } from "@/lib/utils"
import { BellIcon, CalendarIcon, HomeIcon, LogOutIcon, SettingsIcon } from "lucide-react"

const links = [
  { href: "/", label: "Dashboard", exact: true, icon: <HomeIcon className="block md:hidden size-5"/> },
  { href: "/upcoming-matches", label: "Upcoming", exact: false, icon: <CalendarIcon className="block md:hidden size-5"/> },
  { href: "/notifications", label: "Notifications", exact: false, icon: <BellIcon className="block md:hidden size-5"/> },
  { href: "/settings", label: "Settings", exact: false, icon: <SettingsIcon className="block md:hidden size-5"/> },
]

export function NavLinks({ unread }: { unread: number }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex flex-1 items-center gap-4 text-sm">
        <div className="flex items-center gap-6 w-full justify-end">
          {links.map(({ href, label, exact, icon }) => {
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
                {icon}
                {label === "Notifications" && unread > 0 && (
                  <Badge className="h-3 min-w-3 px-1 text-[8px] bg-sky-500 text-white">
                    {unread}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
        <form action={logout} className="ml-auto">
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
            <LogOutIcon className="block md:hidden size-5" />
            <span className="hidden md:block">Logout</span>
          </Button>
        </form>
      </div>
      {/* Desktop */}
      <div className="hidden md:flex flex-1 items-center gap-4 text-sm">
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
    </>
  )
}
