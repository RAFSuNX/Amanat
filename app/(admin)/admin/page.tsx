import { db } from "@/db"
import {
  donations,
  beneficiaries,
  volunteerProfiles,
  specialNeedApplications,
} from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

async function getDashboardStats() {
  const [poolTotal] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(donations)
    .where(eq(donations.status, "CONFIRMED"))

  const [pendingDonations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(donations)
    .where(eq(donations.status, "PENDING"))

  const [pendingBeneficiaries] = await db
    .select({ count: sql<number>`count(*)` })
    .from(beneficiaries)
    .where(eq(beneficiaries.status, "PENDING"))

  const [pendingKyc] = await db
    .select({ count: sql<number>`count(*)` })
    .from(volunteerProfiles)
    .where(eq(volunteerProfiles.kycStatus, "PENDING"))

  const [pendingApplications] = await db
    .select({ count: sql<number>`count(*)` })
    .from(specialNeedApplications)
    .where(eq(specialNeedApplications.status, "PENDING"))

  const activeCycle = await db.query.distributionCycles.findFirst({
    where: (c, { inArray }) =>
      inArray(c.status, ["VOLUNTEER_REVIEW", "ADMIN_REVIEW", "ACTIVE"]),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })

  return {
    totalPool: parseFloat(poolTotal?.total ?? "0"),
    pendingDonations: Number(pendingDonations?.count ?? 0),
    pendingBeneficiaries: Number(pendingBeneficiaries?.count ?? 0),
    pendingKyc: Number(pendingKyc?.count ?? 0),
    pendingApplications: Number(pendingApplications?.count ?? 0),
    activeCycle,
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const pendingItems = [
    { label: "KYC Reviews", count: stats.pendingKyc, href: "/admin/volunteers" },
    { label: "Beneficiary Reviews", count: stats.pendingBeneficiaries, href: "/admin/beneficiaries" },
    { label: "Donations to Confirm", count: stats.pendingDonations, href: "/admin/donations" },
    { label: "Special Need Applications", count: stats.pendingApplications, href: "/admin/applications" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Fund pool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Confirmed Fund Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            ৳{stats.totalPool.toLocaleString("en-BD")}
          </p>
        </CardContent>
      </Card>

      {/* Active cycle */}
      {stats.activeCycle && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">
              Active Cycle: {stats.activeCycle.period}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground capitalize">
              Status: {stats.activeCycle.status.replace(/_/g, " ")}
            </span>
            <Link
              href={`/admin/distributions/${stats.activeCycle.id}`}
              className="text-sm underline"
            >
              View →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pending actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          Pending Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {pendingItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-5">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
