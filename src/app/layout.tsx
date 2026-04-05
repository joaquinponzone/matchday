import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { ScreenSizeIndicator } from "@/components/ui/screen-size-indicator"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Dia de partido",
  description: "Seguimiento de partidos de fútbol",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Dia de partido",
    description: "Seguimiento de partidos de fútbol",
    url: "https://diadepartido.com/",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("antialiased h-100dvh", fontSans.variable, "font-mono", geistMono.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <ScreenSizeIndicator />
      </body>
    </html>
  )
}
