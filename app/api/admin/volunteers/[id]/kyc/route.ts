import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, notFound, parseId, unauthorized } from "@/lib/http"

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid volunteer profile id")
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { action, note } = parsed.data

  const [row] = await db.update(volunteerProfiles).set({
    kycStatus: action === "approve" ? "APPROVED" : "REJECTED",
    kycReviewNote: note ?? null,
    kycReviewedAt: new Date(),
    kycReviewedByAdminId: session.user.id,
  }).where(eq(volunteerProfiles.id, id)).returning({ id: volunteerProfiles.id })
  if (!row) return notFound("Volunteer profile not found")

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: action === "approve" ? "KYC_APPROVED" : "KYC_REJECTED",
    resourceType: "volunteer", resourceId: id,
    details: { note }, request })

  return NextResponse.json({ ok: true })
}
