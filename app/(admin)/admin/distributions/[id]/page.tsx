import { db } from "@/db"
import { distributionCycles, distributionAllotments, beneficiaries } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CycleManage } from "./cycle-manage"

export const dynamic = "force-dynamic"

export default async function ManageCyclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cycleId = Number(id)

  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, cycleId),
  })
  if (!cycle) notFound()

  const rows = await db
    .select({
      id: distributionAllotments.id,
      beneficiaryName: beneficiaries.name,
      district: beneficiaries.district,
      requestedAmount: distributionAllotments.requestedAmount,
      allocatedAmount: distributionAllotments.allocatedAmount,
      manualOverrideAmount: distributionAllotments.manualOverrideAmount,
      volunteerRequestedAmount: distributionAllotments.volunteerRequestedAmount,
      volunteerFlagNote: distributionAllotments.volunteerFlagNote,
      volunteerReceiptUrl: distributionAllotments.volunteerReceiptUrl,
      isFlagged: distributionAllotments.isFlagged,
      deliveryStatus: distributionAllotments.deliveryStatus,
    })
    .from(distributionAllotments)
    .innerJoin(beneficiaries, eq(distributionAllotments.beneficiaryId, beneficiaries.id))
    .where(eq(distributionAllotments.cycleId, cycleId))
    .orderBy(desc(distributionAllotments.isFlagged), beneficiaries.name)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/distributions" className="text-xs text-muted-foreground hover:underline">
          ← All cycles
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold tracking-tight">{cycle.period}</h1>
          <Badge variant={cycle.status === "COMPLETED" || cycle.status === "ACTIVE" ? "default" : "secondary"}>
            {cycle.status.replace(/_/g, " ")}
          </Badge>
        </div>
        {cycle.notes && <p className="text-sm text-muted-foreground mt-1">{cycle.notes}</p>}
      </div>

      <CycleManage
        cycle={{
          id: cycle.id,
          status: cycle.status,
          totalPool: cycle.totalPool,
          specialDeductionTotal: cycle.specialDeductionTotal ?? "0",
          remainingPool: cycle.remainingPool,
        }}
        rows={rows}
      />
    </div>
  )
}
