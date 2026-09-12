import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function LedgerVolunteersPage() {
  const volunteers = await db
    .select({
      name: users.name,
      district: volunteerProfiles.district,
      upazila: volunteerProfiles.upazila,
      kycStatus: volunteerProfiles.kycStatus,
      joinedAt: users.createdAt,
    })
    .from(users)
    .innerJoin(volunteerProfiles, eq(users.id, volunteerProfiles.userId))
    .where(eq(users.role, "VOLUNTEER"))
    .orderBy(volunteerProfiles.kycStatus, users.createdAt)

  const approved = volunteers.filter((v) => v.kycStatus === "APPROVED")

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-8 py-4 flex items-center gap-4">
        <Link href="/" className="font-semibold text-sm">Amanat</Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm">Public Ledger</span>
        <div className="ml-auto flex gap-2">
          <Link href="/ledger/donations"><Button variant="outline" size="sm">Donations</Button></Link>
          <Link href="/ledger/distributions"><Button variant="outline" size="sm">Distributions</Button></Link>
          <Link href="/ledger/volunteers"><Button variant="default" size="sm">Volunteers</Button></Link>
        </div>
      </nav>

      <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Volunteer Ledger</h1>
        <p className="text-sm text-muted-foreground mb-2">
          All verified volunteers are on public record. Transparency is how we build trust.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          {approved.length} verified volunteer{approved.length !== 1 ? "s" : ""} active
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {approved.map((v, i) => (
            <div key={i} className="rounded-lg border p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{v.name}</p>
                <Badge variant="default" className="text-xs shrink-0">Verified</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {v.district}{v.upazila ? `, ${v.upazila}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Joined {v.joinedAt.toLocaleDateString()}
              </p>
            </div>
          ))}
          {approved.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground border rounded-lg">
              No verified volunteers yet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
