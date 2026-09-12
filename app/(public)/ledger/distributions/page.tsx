export const dynamic = "force-dynamic"

import { db } from "@/db"
import { distributionCycles, distributionAllotments, beneficiaries } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PublicNav } from "@/components/public-nav"
import { Button } from "@/components/ui/button"

export default async function LedgerDistributionsPage() {
  const cycles = await db.query.distributionCycles.findMany({
    where: eq(distributionCycles.status, "COMPLETED"),
    orderBy: [desc(distributionCycles.completedAt)],
  })

  const cycleStats = await Promise.all(
    cycles.map(async (c) => {
      const [stats] = await db
        .select({
          count: sql<number>`count(*)`,
          total: sql<string>`coalesce(sum(allocated_amount), 0)`,
        })
        .from(distributionAllotments)
        .where(eq(distributionAllotments.cycleId, c.id))
      return { ...c, familyCount: Number(stats?.count ?? 0), distributed: parseFloat(stats?.total ?? "0") }
    })
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav activeHref="/ledger/distributions" donateButton />

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Distribution Ledger</h1>
        <p className="text-sm text-muted-foreground mb-6">
          All completed distribution cycles. Every taka distributed is accounted for here.
        </p>

        <div className="flex flex-col gap-4">
          {cycleStats.map((c) => (
            <div key={c.id} className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{c.period}</h2>
                <Badge>COMPLETED</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pool</p>
                  <p className="font-medium">৳{parseFloat(c.totalPool).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distributed</p>
                  <p className="font-medium">৳{c.distributed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Families</p>
                  <p className="font-medium">{c.familyCount}</p>
                </div>
              </div>
              {c.notes && (
                <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{c.notes}</p>
              )}
            </div>
          ))}
          {cycleStats.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border rounded-lg">
              No completed distributions yet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
