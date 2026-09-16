import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { beneficiaries } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, conflict, parseId, readJson, unauthorized } from "@/lib/http"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return unauthorized()
  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid beneficiary id")
  const { note } = ((await readJson(req)) ?? {}) as { note?: string }
  const [row] = await db.update(beneficiaries)
    .set({ status: "REJECTED", adminNote: note ?? null, reviewedByAdminId: session.user.id, reviewedAt: new Date() })
    .where(and(eq(beneficiaries.id, id), eq(beneficiaries.status, "PENDING")))
    .returning({ id: beneficiaries.id })
  if (!row) return conflict("Beneficiary is not pending")
  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "BENEFICIARY_REJECTED", resourceType: "beneficiary", resourceId: id,
    details: { note }, request: req })
  return NextResponse.json({ ok: true })
}
