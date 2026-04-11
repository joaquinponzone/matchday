import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"

import { QueryProvider } from "./query-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="mx-auto w-fit max-w-full flex-1 px-4 py-6 lg:max-w-[90%]">
          {children}
        </main>
        <Footer />
      </div>
    </QueryProvider>
  )
}
