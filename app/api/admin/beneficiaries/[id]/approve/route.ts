import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { beneficiaries } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, conflict, parseId, unauthorized } from "@/lib/http"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return unauthorized()
  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid beneficiary id")
  const [row] = await db.update(beneficiaries)
    .set({ status: "APPROVED", reviewedByAdminId: session.user.id, reviewedAt: new Date() })
    .where(and(eq(beneficiaries.id, id), eq(beneficiaries.status, "PENDING")))
    .returning({ id: beneficiaries.id })
  if (!row) return conflict("Beneficiary is not pending")
  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "BENEFICIARY_APPROVED", resourceType: "beneficiary", resourceId: id, request: req })
  return NextResponse.json({ ok: true })
}
