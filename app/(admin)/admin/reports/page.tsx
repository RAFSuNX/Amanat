import { db } from "@/db"
import { donations, beneficiaries, users, distributionCycles, distributionAllotments, volunteerProfiles } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export default async function AdminReportsPage() {
  const [donationStats] = await db.select({
    totalConfirmed: sql<string>`coalesce(sum(amount) filter (where status='CONFIRMED'), 0)`,
    totalPending: sql<string>`coalesce(sum(amount) filter (where status='PENDING'), 0)`,
    countConfirmed: sql<number>`count(*) filter (where status='CONFIRMED')`,
    countPending: sql<number>`count(*) filter (where status='PENDING')`,
  }).from(donations)

  const [beneficiaryStats] = await db.select({
    active: sql<number>`count(*) filter (where status='ACTIVE')`,
    pending: sql<number>`count(*) filter (where status='PENDING')`,
    families: sql<number>`count(*) filter (where type='FAMILY' and status='ACTIVE')`,
    individuals: sql<number>`count(*) filter (where type='INDIVIDUAL' and status='ACTIVE')`,
  }).from(beneficiaries)

  const [volunteerStats] = await db.select({
    total: sql<number>`count(*)`,
    approved: sql<number>`count(*) filter (where kyc_status='APPROVED')`,
    pending: sql<number>`count(*) filter (where kyc_status='PENDING')`,
  }).from(volunteerProfiles)

  const [cycleStats] = await db.select({
    completed: sql<number>`count(*) filter (where status='COMPLETED')`,
    active: sql<number>`count(*) filter (where status='ACTIVE')`,
  }).from(distributionCycles)

  // Actual money distributed = sum of allotment amounts in COMPLETED cycles
  // (the real amount given to families, NOT the cycle budget/total_pool), plus
  // the number of distinct families that have received a distribution.
  const [distStats] = await db.select({
    totalDistributed: sql<string>`coalesce(sum(${distributionAllotments.allocatedAmount}), 0)`,
    familiesServed: sql<number>`count(distinct ${distributionAllotments.beneficiaryId})`,
  })
    .from(distributionAllotments)
    .innerJoin(distributionCycles, eq(distributionAllotments.cycleId, distributionCycles.id))
    .where(eq(distributionCycles.status, "COMPLETED"))

  const [userStats] = await db.select({
    donors: sql<number>`count(*) filter (where role='DONOR')`,
  }).from(users)

  const stats = [
    {
      section: "Donations",
      items: [
        { label: "Total Confirmed", value: `${parseFloat(donationStats?.totalConfirmed ?? "0").toLocaleString()} BDT` },
        { label: "Pending Confirmation", value: `${parseFloat(donationStats?.totalPending ?? "0").toLocaleString()} BDT` },
        { label: "Confirmed Donations", value: String(donationStats?.countConfirmed ?? 0) },
        { label: "Pending Donations", value: String(donationStats?.countPending ?? 0) },
        { label: "Registered Donors", value: String(userStats?.donors ?? 0) },
      ],
    },
    {
      section: "Beneficiaries",
      items: [
        { label: "Active", value: String(beneficiaryStats?.active ?? 0) },
        { label: "Pending Review", value: String(beneficiaryStats?.pending ?? 0) },
        { label: "Active Families", value: String(beneficiaryStats?.families ?? 0) },
        { label: "Active Individuals", value: String(beneficiaryStats?.individuals ?? 0) },
      ],
    },
    {
      section: "Volunteers",
      items: [
        { label: "Total", value: String(volunteerStats?.total ?? 0) },
        { label: "KYC Approved", value: String(volunteerStats?.approved ?? 0) },
        { label: "KYC Pending", value: String(volunteerStats?.pending ?? 0) },
      ],
    },
    {
      section: "Distributions",
      items: [
        { label: "Completed Cycles", value: String(cycleStats?.completed ?? 0) },
        { label: "Active Cycles", value: String(cycleStats?.active ?? 0) },
        { label: "Total Distributed", value: `${parseFloat(distStats?.totalDistributed ?? "0").toLocaleString()} BDT` },
        { label: "Families Served", value: String(distStats?.familiesServed ?? 0) },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">System-wide summary statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map(section => (
          <div key={section.section} className="border border-border/40 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{section.section}</p>
            </div>
            <div className="divide-y divide-border/40">
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
