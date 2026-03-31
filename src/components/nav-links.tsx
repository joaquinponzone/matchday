"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/logout"
import { cn } from "@/lib/utils"
import { BellIcon, HomeIcon, LogOutIcon, SettingsIcon, TrophyIcon, UsersIcon } from "lucide-react"

const links = [
  { href: "/", label: "Inicio", exact: true, icon: <HomeIcon className="block md:hidden size-5" /> },
  { href: "/world-cup", label: "Mundial", exact: false, icon: <TrophyIcon className="block md:hidden size-5" /> },
  { href: "/notifications", label: "Notificaciones", exact: false, icon: <BellIcon className="block md:hidden size-5" /> },
  { href: "/settings", label: "Configuración", exact: false, icon: <SettingsIcon className="block md:hidden size-5" /> },
]

const adminLinks = [
  { href: "/admin/users", label: "Usuarios", exact: false, icon: <UsersIcon className="block md:hidden size-5" /> },
]

const logoutLink = { href: "/logout", label: <span className="text-destructive">Salir</span>, exact: false, icon: <LogOutIcon className="block md:hidden text-destructive size-5" /> }

export function NavLinks({ unread, role }: { unread: number; role: string }) {
  const pathname = usePathname()
  const allLinks = role === "admin" ? [...links, ...adminLinks, logoutLink] : [...links, logoutLink]

  return (
    <div className="flex flex-1 items-center gap-4 text-sm">
      <div className="flex items-center gap-6 w-full justify-end">
        {allLinks.map(({ href, label, exact, icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 transition-colors hover:text-foreground",
                active ? "text-foreground font-medium md:border-b-2 md:border-blue-300" : "text-muted-foreground animate-in fade-in-0 duration-700",
              )}
            >
              <span className="hidden md:block">{label}</span>
              <span className="block md:hidden">{icon}</span>
              {label === "Notificaciones" && unread > 0 && (
                <Badge className="h-3 min-w-3 px-1 text-[8px] bg-sky-500 text-white">
                  {unread}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
      
    </div>
  )
}
