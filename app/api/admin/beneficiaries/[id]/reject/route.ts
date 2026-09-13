import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { beneficiaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { note } = await req.json()
  await db.update(beneficiaries)
    .set({ status: "REJECTED", adminNote: note ?? null, reviewedByAdminId: session.user.id, reviewedAt: new Date() })
    .where(eq(beneficiaries.id, Number(id)))
  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "BENEFICIARY_REJECTED", resourceType: "beneficiary", resourceId: id,
    details: { note }, request: req })
  return NextResponse.json({ ok: true })
}
