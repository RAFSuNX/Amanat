export const dynamic = "force-dynamic"

import { db } from "@/db"
import { distributionCycles, distributionAllotments, beneficiaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { PublicNav } from "@/components/public-nav"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

export default async function PublicCycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, Number(id)),
  })
  // Only completed cycles are public — in-progress cycles are not exposed.
  if (!cycle || cycle.status !== "COMPLETED") notFound()

  const rows = await db
    .select({
      id: distributionAllotments.id,
      amount: distributionAllotments.allocatedAmount,
      deliveryStatus: distributionAllotments.deliveryStatus,
      name: beneficiaries.name,
      district: beneficiaries.district,
    })
    .from(distributionAllotments)
    .innerJoin(beneficiaries, eq(distributionAllotments.beneficiaryId, beneficiaries.id))
    .where(eq(distributionAllotments.cycleId, cycle.id))
    .orderBy(beneficiaries.name)

  const total = rows.reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0)
  const delivered = rows.filter((r) => r.deliveryStatus === "DELIVERED").length

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav activeHref="/ledger/distributions" donateButton />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <Link href="/ledger/distributions" className="text-xs text-muted-foreground hover:underline">
          ← All distributions
        </Link>
        <div className="flex items-center gap-3 mt-2 mb-1">
          <h1 className="text-2xl font-bold">{cycle.period} Distribution</h1>
          <Badge>COMPLETED</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Every family and the exact amount they received. {rows.length} families,
          ৳{total.toLocaleString()} distributed, {delivered} deliveries confirmed.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>District</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Delivery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.district}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  ৳{parseFloat(r.amount ?? "0").toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={r.deliveryStatus === "DELIVERED" ? "default" : "secondary"}>
                    {r.deliveryStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  )
}
