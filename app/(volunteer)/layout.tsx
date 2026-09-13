import Link from "next/link"
import { requireVolunteer } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SignOutButton } from "@/components/sign-out-button"
import { KycGate } from "@/components/kyc-gate"
import { SidebarNav } from "@/components/sidebar-nav"
import { MobileMenu } from "@/components/mobile-menu"

const NAV = [
  { href: "/volunteer", label: "Dashboard" },
  { href: "/volunteer/beneficiaries", label: "Beneficiaries" },
  { href: "/volunteer/applications", label: "Special Needs" },
  { href: "/volunteer/deliveries", label: "Deliveries" },
  { href: "/volunteer/kyc", label: "My KYC" },
  { href: "/volunteer/profile", label: "My Profile" },
  { href: "/donate", label: "Donate" },
]

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireVolunteer()
  if (!session) redirect("/login")

  let kycLocked = false
  if ((session.user as { role?: string }).role === "VOLUNTEER") {
    const profile = await db.query.volunteerProfiles.findFirst({
      where: eq(volunteerProfiles.userId, session.user.id),
    })
    // Lock all pages except /volunteer/kyc so the user can still submit KYC
    kycLocked = !profile || profile.kycStatus !== "APPROVED"
  }

  return (
    <div className="h-dvh w-dvw flex flex-col md:flex-row overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 h-14 border-b border-border/40 px-4 flex items-center justify-between bg-background shrink-0">
        <Link href="/">
          <img src="/logo.png" alt="Amanat" className="h-10 w-auto object-contain" />
        </Link>
        <MobileMenu links={NAV} signIn={false} />
      </div>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-52 border-r border-border/40 shrink-0 bg-muted/20">
        <div className="h-16 px-4 border-b border-border/40 flex items-center gap-2">
          <Link href="/">
            <img src="/logo.png" alt="Amanat" className="h-12 w-auto object-contain" />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Volunteer</span>
        </div>

        <SidebarNav items={NAV} />

        <div className="px-6 py-5 border-t border-border/40 flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground truncate">{session.user.name}</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main - KYC page always accessible even when locked */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        {kycLocked ? (
          <KycGate>{children}</KycGate>
        ) : children}
      </main>
    </div>
  )
}
