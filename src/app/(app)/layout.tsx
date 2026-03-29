import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-fit max-w-[90%] md:max-w-[70%] px-4 py-6">{children}</main>
      <Footer />
    </>
  )
}
