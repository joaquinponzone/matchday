import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"

import { MainContainer } from "./main-container"
import { QueryProvider } from "./query-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <MainContainer>{children}</MainContainer>
        <Footer />
      </div>
    </QueryProvider>
  )
}
