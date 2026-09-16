import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionAllotments, distributionCycles, beneficiaries } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"
import { log } from "@/lib/audit"
import { finalAmount } from "@/lib/allotment"
import { badRequest, conflict, notFound, parseId, unauthorized } from "@/lib/http"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVolunteer()
  if (!session) return unauthorized()

  const allotmentId = parseId((await params).id)
  if (allotmentId === null) return badRequest("Invalid allotment id")

  // IDOR check: only allow if this volunteer registered the beneficiary.
  const allotment = await db.query.distributionAllotments.findFirst({
    where: eq(distributionAllotments.id, allotmentId),
    columns: { beneficiaryId: true, cycleId: true, allocatedAmount: true, manualOverrideAmount: true },
  })

  if (!allotment) return notFound()

  // Delivery is only allowed once the cycle is ACTIVE (approved & funded).
  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, allotment.cycleId),
    columns: { status: true },
  })
  if (cycle?.status !== "ACTIVE")
    return badRequest("This cycle is not active for delivery.")

  const ben = await db.query.beneficiaries.findFirst({
    where: eq(beneficiaries.id, allotment.beneficiaryId),
    columns: { registeredByVolunteerId: true },
  })

  if (!ben || ben.registeredByVolunteerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Idempotent: only a still-PENDING allotment can be delivered. A retry or a
  // second volunteer tap can't overwrite the recorded delivery (who/when/amount).
  const [row] = await db
    .update(distributionAllotments)
    .set({ deliveryStatus: "DELIVERED", deliveredAt: new Date(), deliveredByVolunteerId: session.user.id })
    .where(and(eq(distributionAllotments.id, allotmentId), eq(distributionAllotments.deliveryStatus, "PENDING")))
    .returning({ id: distributionAllotments.id })
  if (!row) return conflict("This allotment has already been delivered.")

  await log({ userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "ALLOTMENT_DELIVERED", resourceType: "allotment", resourceId: allotmentId,
    details: { beneficiaryId: allotment.beneficiaryId, amount: finalAmount(allotment) }, request: req })

  return NextResponse.json({ ok: true })
}
