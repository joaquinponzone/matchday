"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { logout } from "@/app/actions/logout"
import { NotificationPopover } from "@/components/notification-popover"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

const links = [
  {
    href: "/",
    label: "Inicio",
    exact: true,
    icon: <HomeIcon className="block size-5 md:hidden" />,
  },
  {
    href: "/world-cup",
    label: "Mundial",
    exact: false,
    icon: <TrophyIcon className="block size-5 md:hidden" />,
  },
  {
    href: "/settings",
    label: "Configuración",
    exact: false,
    icon: <SettingsIcon className="block size-5 md:hidden" />,
  },
]

const adminLinks = [
  {
    href: "/admin/users",
    label: "Usuarios",
    exact: false,
    icon: <UsersIcon className="block size-5 md:hidden" />,
  },
]

export function NavLinks({ unread, role }: { unread: number; role: string }) {
  const pathname = usePathname()
  const baseLinks = role === "admin" ? [...links, ...adminLinks] : links

  return (
    <div className="flex flex-1 items-center gap-4 text-sm">
      <div className="flex w-full items-center justify-end gap-6">
        {baseLinks.map(({ href, label, exact, icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 transition-colors hover:text-foreground",
                active
                  ? "font-medium text-foreground md:border-b-2 md:border-blue-300"
                  : "animate-in text-muted-foreground duration-700 fade-in-0"
              )}
            >
              <span className="hidden md:block">{label}</span>
              <span className="block md:hidden">{icon}</span>
            </Link>
          )
        })}
        <NotificationPopover unread={unread} />
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            className="flex animate-in cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors duration-700 fade-in-0 hover:text-foreground"
          >
            <span className="hidden text-destructive md:block">Salir</span>
            <LogOutIcon className="block size-5 text-destructive md:hidden" />
          </button>
        </form>
      </div>
    </div>
  )
}
