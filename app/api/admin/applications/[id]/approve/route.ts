import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { specialNeedApplications } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, conflict, parseId, unauthorized } from "@/lib/http"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return unauthorized()
  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid application id")
  const { approvedAmount, note } = await req.json()

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
