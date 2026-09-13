import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { specialNeedApplications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { approvedAmount, note } = await req.json()

  await db.update(specialNeedApplications).set({
    status: "APPROVED",
    approvedAmount: approvedAmount ? approvedAmount.toFixed(2) : null,
    adminNote: note ?? null,
    reviewedByAdminId: session.user.id,
    reviewedAt: new Date(),
  }).where(eq(specialNeedApplications.id, Number(id)))

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "APPLICATION_APPROVED", resourceType: "application", resourceId: id,
    details: { approvedAmount, note }, request: req })

  return NextResponse.json({ ok: true })
}
