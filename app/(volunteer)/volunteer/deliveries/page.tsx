import { getSession } from "@/lib/session"
import { db } from "@/db"
import { distributionAllotments, distributionCycles, beneficiaries } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DeliveryActions } from "./delivery-actions"

export default async function DeliveriesPage() {
  const session = await getSession()
  if (!session) return null

  // Find active/review cycle
  const activeCycle = await db.query.distributionCycles.findFirst({
    where: (c, { inArray }) =>
      inArray(c.status, ["VOLUNTEER_REVIEW", "ADMIN_REVIEW", "ACTIVE"]),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })

  const rows = activeCycle
    ? await db
        .select({
          id: distributionAllotments.id,
          allocatedAmount: distributionAllotments.allocatedAmount,
          deliveryStatus: distributionAllotments.deliveryStatus,
          isFlagged: distributionAllotments.isFlagged,
          volunteerFlagNote: distributionAllotments.volunteerFlagNote,
          deliveredAt: distributionAllotments.deliveredAt,
          beneficiaryName: beneficiaries.name,
          beneficiaryDistrict: beneficiaries.district,
          cycleStatus: distributionCycles.status,
          period: distributionCycles.period,
        })
        .from(distributionAllotments)
        .innerJoin(beneficiaries, eq(distributionAllotments.beneficiaryId, beneficiaries.id))
        .innerJoin(distributionCycles, eq(distributionAllotments.cycleId, distributionCycles.id))
        .where(
          and(
            eq(distributionAllotments.cycleId, activeCycle.id),
            eq(distributionAllotments.deliveredByVolunteerId, session.user.id)
          )
        )
    : []

  // Also show all beneficiaries registered by this volunteer for review flagging
  const myBeneficiaryIds = await db
    .select({ id: beneficiaries.id })
    .from(beneficiaries)
    .where(eq(beneficiaries.registeredByVolunteerId, session.user.id))

  const myIds = new Set(myBeneficiaryIds.map((b) => b.id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCycle
            ? `Active cycle: ${activeCycle.period} — ${activeCycle.status.replace(/_/g, " ")}`
            : "No active distribution cycle at the moment."}
        </p>
      </div>

      {!activeCycle && (
        <div className="border border-border/40 rounded p-8 text-center text-muted-foreground text-sm">
          When a distribution cycle is opened for volunteer review, your allotments will appear here.
        </div>
      )}

      {activeCycle && rows.length === 0 && (
        <div className="border border-border/40 rounded p-8 text-center text-muted-foreground text-sm">
          No allotments assigned to you for this cycle yet.
        </div>
      )}

      {rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.beneficiaryName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.beneficiaryDistrict}</TableCell>
                <TableCell className="tabular-nums font-medium">
                  {r.allocatedAmount ? `${parseFloat(r.allocatedAmount).toLocaleString()} BDT` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={r.deliveryStatus === "DELIVERED" ? "default" : "secondary"}>
                    {r.deliveryStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.isFlagged && (
                    <Badge variant="destructive" className="text-xs">Flagged</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DeliveryActions
                    allotmentId={r.id}
                    deliveryStatus={r.deliveryStatus}
                    cycleStatus={r.cycleStatus}
                    isFlagged={r.isFlagged}
                    flagNote={r.volunteerFlagNote ?? ""}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
