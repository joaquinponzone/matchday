import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="mx-auto w-fit max-w-full lg:max-w-[90%] px-4 py-6 flex-1">{children}</main>
      <Footer />
    </div>
  )
}
