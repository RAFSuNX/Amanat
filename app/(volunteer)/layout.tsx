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

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireVolunteer()
  if (!session) redirect("/login")

  // Check KYC for volunteers (admins bypass)
  let kycLocked = false
  if ((session.user as { role?: string }).role === "VOLUNTEER") {
    const profile = await db.query.volunteerProfiles.findFirst({
      where: eq(volunteerProfiles.userId, session.user.id),
    })
    kycLocked = !profile || profile.kycStatus !== "APPROVED"
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r flex flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/" className="font-semibold">Amanat</Link>
          <p className="text-xs text-muted-foreground mt-0.5">Volunteer Portal</p>
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

      <main className="flex-1 overflow-auto p-8">
        {kycLocked ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <h2 className="text-xl font-semibold">KYC Pending</h2>
            <p className="text-muted-foreground max-w-sm">
              Your account is under review. Please submit your KYC documents and
              wait for admin approval before accessing the volunteer portal.
            </p>
            <Link href="/volunteer/kyc" className="underline text-sm">
              Submit KYC →
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
