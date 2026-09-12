import Link from "next/link"
import Image from "next/image"
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
    <div className="h-dvh w-dvw flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border/40 flex flex-col shrink-0 bg-muted/20">
        <div className="h-16 px-4 border-b border-border/40 flex items-center gap-2">
          <Link href="/">
            <Image src="/logo.png" alt="Amanat" width={80} height={32} className="h-8 w-auto object-contain" />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Admin</span>
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
      <main className="flex-1 overflow-y-auto p-10">{children}</main>
    </div>
  )
}
