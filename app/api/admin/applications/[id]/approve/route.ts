import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { specialNeedApplications } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, conflict, parseId, readJson, unauthorized } from "@/lib/http"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return unauthorized()
  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid application id")
  const { approvedAmount, note } = ((await readJson(req)) ?? {}) as { approvedAmount?: number; note?: string }

  // Server-side guard: an approved amount, if given, must be a real non-negative
  // number - never trust the client to have validated the money field.
  if (approvedAmount != null &&
      (typeof approvedAmount !== "number" || !Number.isFinite(approvedAmount) || approvedAmount < 0))
    return badRequest("Approved amount must be a non-negative number")

  const [row] = await db.update(specialNeedApplications).set({
    status: "APPROVED",
    approvedAmount: approvedAmount ? approvedAmount.toFixed(2) : null,
    adminNote: note ?? null,
    reviewedByAdminId: session.user.id,
    reviewedAt: new Date(),
  }).where(and(eq(specialNeedApplications.id, id), eq(specialNeedApplications.status, "PENDING")))
    .returning({ id: specialNeedApplications.id })
  if (!row) return conflict("Application is not pending")

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "APPLICATION_APPROVED", resourceType: "application", resourceId: id,
    details: { approvedAmount, note }, request: req })

  return NextResponse.json({ ok: true })
}
