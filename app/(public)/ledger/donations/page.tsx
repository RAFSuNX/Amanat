import { db } from "@/db"
import { donations, distributionAllotments, distributionCycles, needAssessments, beneficiaries } from "@/db/schema"
import { eq, desc, sql, and, inArray } from "drizzle-orm"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DonationQuickView } from "./donation-modal"

function maskRef(ref: string) {
  if (ref.length <= 6) return ref
  return ref.slice(0, 3) + "****" + ref.slice(-3)
}

function receiptNumber(id: number, date: Date) {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "")
  return `AMT-${d}-${String(id).padStart(5, "0")}`
}

async function getFundStats() {
  // Total money in
  const [inRow] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(donations)
    .where(eq(donations.status, "CONFIRMED"))

  // Total money out (allotments from completed cycles)
  const completedCycles = await db
    .select({ id: distributionCycles.id })
    .from(distributionCycles)
    .where(eq(distributionCycles.status, "COMPLETED"))

  let totalOut = 0
  if (completedCycles.length > 0) {
    const [outRow] = await db
      .select({ total: sql<string>`coalesce(sum(allocated_amount), 0)` })
      .from(distributionAllotments)
      .where(inArray(distributionAllotments.cycleId, completedCycles.map((c) => c.id)))
    totalOut = parseFloat(outRow?.total ?? "0")
  }

  // Current monthly need: sum of latest active assessments for active beneficiaries
  const [needRow] = await db
    .select({ total: sql<string>`coalesce(sum(na.declared_monthly_need), 0)` })
    .from(needAssessments)
    .innerJoin(beneficiaries, eq(needAssessments.beneficiaryId, beneficiaries.id))
    .where(
      and(
        eq(needAssessments.status, "ACTIVE"),
        eq(beneficiaries.status, "ACTIVE")
      )
    )

  const totalIn = parseFloat(inRow?.total ?? "0")
  const monthlyNeeded = parseFloat(needRow?.total ?? "0")

  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    monthlyNeeded,
  }
}

export default async function LedgerDonationsPage() {
  const [rows, stats] = await Promise.all([
    db.query.donations.findMany({
      where: eq(donations.status, "CONFIRMED"),
      orderBy: [desc(donations.confirmedAt)],
    }),
    getFundStats(),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="font-semibold text-sm">Amanat</Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm">Public Ledger</span>
        <div className="ml-auto flex gap-2">
          <Link href="/ledger/donations"><Button variant="default" size="sm">Donations</Button></Link>
          <Link href="/ledger/distributions"><Button variant="outline" size="sm">Distributions</Button></Link>
          <Link href="/ledger/volunteers"><Button variant="outline" size="sm">Volunteers</Button></Link>
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Donation Ledger</h1>
        <p className="text-sm text-muted-foreground mb-6">
          All confirmed donations. Click a receipt number to view details. Anonymous donors have their name hidden only.
        </p>

        {/* Fund summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border mb-8">
          {[
            {
              label: "Total In",
              value: `${stats.totalIn.toLocaleString("en-BD")} BDT`,
              sub: "Confirmed donations",
              color: "text-primary",
            },
            {
              label: "Total Out",
              value: `${stats.totalOut.toLocaleString("en-BD")} BDT`,
              sub: "Completed distributions",
              color: "text-foreground",
            },
            {
              label: "Current Balance",
              value: `${stats.balance.toLocaleString("en-BD")} BDT`,
              sub: "Available in pool",
              color: stats.balance >= 0 ? "text-primary" : "text-destructive",
            },
            {
              label: "Monthly Need",
              value: `${stats.monthlyNeeded.toLocaleString("en-BD")} BDT`,
              sub: "Accumulated from all families",
              color: "text-foreground",
            },
          ].map((s) => (
            <div key={s.label} className="bg-card px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Txn Ref</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const confirmedAt = d.confirmedAt ?? d.createdAt
              const receipt = receiptNumber(d.id, confirmedAt)
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <DonationQuickView
                      donation={{
                        id: d.id,
                        donorName: d.donorName,
                        isAnonymous: d.isAnonymous,
                        amount: d.amount,
                        method: d.method,
                        transactionRef: d.transactionRef,
                        confirmedAt: confirmedAt.toISOString(),
                        receipt,
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {confirmedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>{d.isAnonymous ? "Anonymous" : d.donorName}</TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {parseFloat(d.amount).toLocaleString()} BDT
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.method}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {maskRef(d.transactionRef)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/ledger/donations/${d.id}/invoice`}
                      target="_blank"
                      className="text-xs text-primary hover:underline underline-offset-2"
                    >
                      Invoice
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No confirmed donations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  )
}
