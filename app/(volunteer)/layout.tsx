import Link from "next/link"
import { requireVolunteer } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SignOutButton } from "@/components/sign-out-button"

const NAV = [
  { href: "/volunteer", label: "Dashboard" },
  { href: "/volunteer/beneficiaries", label: "Beneficiaries" },
  { href: "/volunteer/applications", label: "Special Needs" },
  { href: "/volunteer/deliveries", label: "Deliveries" },
  { href: "/volunteer/kyc", label: "My KYC" },
]

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireVolunteer()
  if (!session) redirect("/login")

  let kycLocked = false
  if ((session.user as { role?: string }).role === "VOLUNTEER") {
    const profile = await db.query.volunteerProfiles.findFirst({
      where: eq(volunteerProfiles.userId, session.user.id),
    })
    kycLocked = !profile || profile.kycStatus !== "APPROVED"
  }

  return (
    <div className="h-dvh w-dvw flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border/40 flex flex-col shrink-0 bg-muted/20">
        <div className="px-6 py-5 border-b border-border/40">
          <Link href="/" className="text-sm font-semibold tracking-tight">Amanat</Link>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">Volunteer</p>
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
      <main className="flex-1 overflow-y-auto p-10">
        {kycLocked ? (
          <div className="flex flex-col gap-4 max-w-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Access Restricted</p>
            <h2 className="text-xl font-bold tracking-tight">KYC Pending</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Submit your KYC documents and wait for admin approval before accessing the volunteer portal.
            </p>
            <Link href="/volunteer/kyc" className="text-sm text-primary underline underline-offset-2">
              Submit KYC
            </Link>
          </div>
        ) : children}
      </main>
    </div>
  )
}
