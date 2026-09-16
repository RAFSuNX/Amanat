import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { specialNeedApplications, beneficiaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"
import { log } from "@/lib/audit"
import { conflict, isUniqueViolation, unauthorized } from "@/lib/http"

const schema = z.object({
  beneficiaryId: z.number().int().positive(),
  title: z.string().min(3),
  description: z.string().min(10),
  amountRequested: z.number().positive(),
})

export async function POST(request: NextRequest) {
  const session = await requireVolunteer()
  if (!session) return unauthorized()

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { beneficiaryId, title, description, amountRequested } = parsed.data

  // Verify volunteer owns this beneficiary
  const beneficiary = await db.query.beneficiaries.findFirst({
    where: and(
      eq(beneficiaries.id, beneficiaryId),
      eq(beneficiaries.registeredByVolunteerId, session.user.id)
    ),
  })
  if (!beneficiary) return NextResponse.json({ error: "Beneficiary not found or not yours." }, { status: 403 })

  let app: { id: number }
  try {
    ;[app] = await db.insert(specialNeedApplications).values({
      beneficiaryId,
      submittedByVolunteerId: session.user.id,
      title,
      description,
      amountRequested: amountRequested.toFixed(2),
      status: "PENDING",
      deliveryStatus: "PENDING",
    }).returning({ id: specialNeedApplications.id })
  } catch (e) {
    if (isUniqueViolation(e))
      return conflict("An open application with this title already exists for this beneficiary.")
    throw e
  }

  await log({ userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "APPLICATION_SUBMITTED", resourceType: "application", resourceId: app.id,
    details: { beneficiaryId, title, amountRequested }, request })

  return NextResponse.json({ ok: true }, { status: 201 })
}
