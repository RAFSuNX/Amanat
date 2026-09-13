import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionAllotments, beneficiaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"
import { log } from "@/lib/audit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const allotmentId = Number(id)

  // IDOR check: only allow if this volunteer registered the beneficiary
  const allotment = await db.query.distributionAllotments.findFirst({
    where: eq(distributionAllotments.id, allotmentId),
    columns: { beneficiaryId: true },
  })

  if (!allotment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ben = await db.query.beneficiaries.findFirst({
    where: eq(beneficiaries.id, allotment.beneficiaryId),
    columns: { registeredByVolunteerId: true },
  })

  if (!ben || ben.registeredByVolunteerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db
    .update(distributionAllotments)
    .set({ deliveryStatus: "DELIVERED", deliveredAt: new Date(), deliveredByVolunteerId: session.user.id })
    .where(eq(distributionAllotments.id, allotmentId))

  await log({ userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "ALLOTMENT_DELIVERED", resourceType: "allotment", resourceId: id,
    details: { beneficiaryId: allotment.beneficiaryId }, request: req })

  return NextResponse.json({ ok: true })
}
