import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { badRequest, conflict, parseId, unauthorized } from "@/lib/http"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const id = parseId((await params).id)
  if (id === null) return badRequest("Invalid donation id")

  // Guard the transition on status: only a PENDING donation confirms. This makes
  // it idempotent-safe - a double click or stale tab cannot re-confirm (and
  // overwrite confirmedBy/At) or flip a rejected donation.
  const [row] = await db
    .update(donations)
    .set({ status: "CONFIRMED", confirmedByAdminId: session.user.id, confirmedAt: new Date() })
    .where(and(eq(donations.id, id), eq(donations.status, "PENDING")))
    .returning({ id: donations.id })
  if (!row) return conflict("Donation is not pending")

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "DONATION_CONFIRMED", resourceType: "donation", resourceId: id, request: req })

  return NextResponse.json({ ok: true })
}
