import { getSession } from "@/lib/session"
import { db } from "@/db"
import { distributionAllotments, distributionCycles, beneficiaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DeliveryActions } from "./delivery-actions"

export const dynamic = "force-dynamic"

export default async function DeliveriesPage() {
  const session = await getSession()
  if (!session) return null

  // Find the current cycle that volunteers can act on.
  const activeCycle = await db.query.distributionCycles.findFirst({
    where: (c, { inArray }) =>
      inArray(c.status, ["VOLUNTEER_REVIEW", "ADMIN_REVIEW", "ACTIVE"]),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })

  // Allotments for families THIS volunteer registered (not "delivered by",
  // which is only set after delivery — that was the original bug).
  const rows = activeCycle
    ? await db
        .select({
          id: distributionAllotments.id,
          requestedAmount: distributionAllotments.requestedAmount,
          allocatedAmount: distributionAllotments.allocatedAmount,
          deliveryStatus: distributionAllotments.deliveryStatus,
          isFlagged: distributionAllotments.isFlagged,
          volunteerFlagNote: distributionAllotments.volunteerFlagNote,
          volunteerRequestedAmount: distributionAllotments.volunteerRequestedAmount,
          beneficiaryName: beneficiaries.name,
          beneficiaryDistrict: beneficiaries.district,
          cycleStatus: distributionCycles.status,
        })
        .from(distributionAllotments)
        .innerJoin(beneficiaries, eq(distributionAllotments.beneficiaryId, beneficiaries.id))
        .innerJoin(distributionCycles, eq(distributionAllotments.cycleId, distributionCycles.id))
        .where(
          and(
            eq(distributionAllotments.cycleId, activeCycle.id),
            eq(beneficiaries.registeredByVolunteerId, session.user.id)
          )
        )
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCycle
            ? `Current cycle: ${activeCycle.period} — ${activeCycle.status.replace(/_/g, " ")}`
            : "No active distribution cycle at the moment."}
        </p>
        {activeCycle?.status === "VOLUNTEER_REVIEW" && (
          <p className="text-xs text-muted-foreground mt-1">
            Review the calculated amounts below. If a family needs a different amount this month,
            request an adjustment with a reason (and a receipt if you have one).
          </p>
        )}
      </div>

      {!activeCycle && (
        <div className="border border-border/40 rounded p-8 text-center text-muted-foreground text-sm">
          When a distribution cycle is opened for volunteer review, your allotments will appear here.
        </div>
      )}

      {activeCycle && rows.length === 0 && (
        <div className="border border-border/40 rounded p-8 text-center text-muted-foreground text-sm">
          None of your registered families are in this cycle yet.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>District</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.beneficiaryName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.beneficiaryDistrict}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {r.allocatedAmount ? `${parseFloat(r.allocatedAmount).toLocaleString()} BDT` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={r.deliveryStatus === "DELIVERED" ? "default" : "secondary"}>
                    {r.deliveryStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.isFlagged && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        {r.volunteerRequestedAmount
                          ? `${parseFloat(r.volunteerRequestedAmount).toLocaleString()} BDT`
                          : "Flagged"}
                      </span>
                      {r.volunteerFlagNote && (
                        <span className="text-[10px] text-muted-foreground">{r.volunteerFlagNote}</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DeliveryActions
                    allotmentId={r.id}
                    deliveryStatus={r.deliveryStatus}
                    cycleStatus={r.cycleStatus}
                    isFlagged={r.isFlagged}
                    flagNote={r.volunteerFlagNote ?? ""}
                    requestedAmount={r.volunteerRequestedAmount ?? r.allocatedAmount ?? ""}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  )
}
