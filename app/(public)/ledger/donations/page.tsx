export const dynamic = "force-dynamic"

import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Donation Ledger",
  description: "All confirmed and pending donations to Amanat. Full transparency — every taka in is recorded here.",
  openGraph: {
    title: "Donation Ledger | Amanat",
    description: "All confirmed and pending donations to Amanat. Full transparency — every taka in is recorded here.",
    url: "https://theamanat.org/ledger/donations",
  },
}

import { ledgerDb as db } from "@/db/remote"
import { donations, distributionAllotments, distributionCycles, needAssessments, beneficiaries } from "@/db/schema"
import { eq, desc, sql, and, inArray } from "drizzle-orm"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PublicNav } from "@/components/public-nav"
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
  // Total money in (confirmed only)
  const [inRow] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(donations)
    .where(eq(donations.status, "CONFIRMED"))

  // Pending total
  const [pendingRow] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)`, count: sql<number>`count(*)` })
    .from(donations)
    .where(eq(donations.status, "PENDING"))

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
    .select({ total: sql<string>`coalesce(sum("need_assessments"."declared_monthly_need"), 0)` })
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
    pendingTotal: parseFloat(pendingRow?.total ?? "0"),
    pendingCount: Number(pendingRow?.count ?? 0),
  }
}

export default async function LedgerDonationsPage() {
  const [rows, stats] = await Promise.all([
    db.query.donations.findMany({
      where: (d, { ne }) => ne(d.status, "REJECTED"),
      orderBy: [desc(donations.createdAt)],
    }),
    getFundStats(),
  ])

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav activeHref="/ledger/donations" donateButton />

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Donation Ledger</h1>
        <p className="text-sm text-muted-foreground mb-6">
          All donations including those pending confirmation. Pending donations are in review and will be added to the fund once verified. Click a receipt to view details.
        </p>

        {/* Fund summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border rounded-lg overflow-hidden border border-border mb-8">
          {[
            {
              label: "Total In",
              value: `${stats.totalIn.toLocaleString("en-BD")} BDT`,
              sub: "Confirmed donations",
              color: "text-primary",
            },
            {
              label: "Pending",
              value: `${stats.pendingTotal.toLocaleString("en-BD")} BDT`,
              sub: `${stats.pendingCount} donation${stats.pendingCount !== 1 ? "s" : ""} in review`,
              color: "text-amber-600",
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

        <div className="overflow-x-auto">
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
              const isPending = d.status === "PENDING"
              const displayDate = (isPending ? d.createdAt : (d.confirmedAt ?? d.createdAt))
              const receipt = isPending ? null : receiptNumber(d.id, displayDate)
              return (
                <TableRow key={d.id} className={isPending ? "opacity-70" : ""}>
                  <TableCell>
                    {receipt ? (
                      <DonationQuickView
                        donation={{
                          id: d.id,
                          donorName: d.donorName,
                          isAnonymous: d.isAnonymous,
                          amount: d.amount,
                          method: d.method,
                          transactionRef: d.transactionRef,
                          confirmedAt: displayDate.toISOString(),
                          receipt,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {displayDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
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
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        In Review
                      </span>
                    ) : (
                      <Link
                        href={`/ledger/donations/${d.id}/invoice`}
                        target="_blank"
                        className="text-xs text-primary hover:underline underline-offset-2"
                      >
                        Invoice
                      </Link>
                    )}
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
        </div>
      </main>
    </div>
  )
}
