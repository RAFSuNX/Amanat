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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/" className="font-semibold">Amanat</Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t">
          <p className="text-xs text-muted-foreground truncate mb-2">
            {session.user.name}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
