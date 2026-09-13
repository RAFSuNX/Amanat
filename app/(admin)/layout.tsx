import Link from "next/link"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileMenu } from "@/components/mobile-menu"

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/beneficiaries", label: "Beneficiaries" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/distributions", label: "Distributions" },
  { href: "/admin/applications", label: "Special Needs" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit Log" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  return (
    <div className="h-dvh w-dvw flex flex-col md:flex-row overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 h-16 border-b border-border/40 px-4 flex items-center justify-between bg-background shrink-0">
        <Link href="/">
          <img src="/logo.png" alt="Amanat" className="h-12 w-auto object-contain" />
        </Link>
        <MobileMenu links={NAV} signIn={false} />
      </div>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-52 border-r border-border/40 shrink-0 bg-muted/20">
        <div className="h-16 px-4 border-b border-border/40 flex items-center gap-2">
          <Link href="/">
            <img src="/logo.png" alt="Amanat" className="h-12 w-auto object-contain" />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Admin</span>
        </div>

        <SidebarNav items={NAV} />

        <div className="px-6 py-5 border-t border-border/40 flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground truncate">{session.user.name}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">{children}</main>
    </div>
  )
}
