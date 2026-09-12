import Link from "next/link"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/beneficiaries", label: "Beneficiaries" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/distributions", label: "Distributions" },
  { href: "/admin/applications", label: "Special Needs" },
  { href: "/admin/reports", label: "Reports" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border/40 flex flex-col shrink-0 bg-muted/20">
        <div className="px-6 py-5 border-b border-border/40">
          <Link href="/" className="text-sm font-semibold tracking-tight">Amanat</Link>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2.5 rounded text-xs hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-border/40 flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground truncate">{session.user.name}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-10">{children}</main>
    </div>
  )
}
