import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionAllotments, distributionCycles, beneficiaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"
import { log } from "@/lib/audit"
import { volunteerRequestSchema } from "@/lib/contracts"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const allotmentId = Number(id)

  const parsed = volunteerRequestSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const { note, requestedAmount, receiptUrl } = parsed.data

  const allotment = await db.query.distributionAllotments.findFirst({
    where: eq(distributionAllotments.id, allotmentId),
    columns: { beneficiaryId: true, cycleId: true },
  })
  if (!allotment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Requests can only be made while the cycle is open for volunteer review.
  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, allotment.cycleId),
    columns: { status: true },
  })
  if (cycle?.status !== "VOLUNTEER_REVIEW")
    return NextResponse.json({ error: "This cycle is not open for volunteer review." }, { status: 400 })

  // IDOR check: only the volunteer who registered the beneficiary may request.
  const ben = await db.query.beneficiaries.findFirst({
    where: eq(beneficiaries.id, allotment.beneficiaryId),
    columns: { registeredByVolunteerId: true },
  })
  if (!ben || ben.registeredByVolunteerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(distributionAllotments).set({
    isFlagged: true,
    volunteerFlagNote: note,
    volunteerRequestedAmount: requestedAmount != null ? requestedAmount.toFixed(2) : null,
    volunteerReceiptUrl: receiptUrl ?? null,
    reviewedByVolunteerId: session.user.id,
  }).where(eq(distributionAllotments.id, allotmentId))

  await log({
    userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "ALLOTMENT_REQUESTED", resourceType: "allotment", resourceId: id,
    details: { note, requestedAmount: requestedAmount ?? null, receiptUrl: receiptUrl ?? null,
      beneficiaryId: allotment.beneficiaryId },
    request,
  })

  return NextResponse.json({ ok: true })
}
