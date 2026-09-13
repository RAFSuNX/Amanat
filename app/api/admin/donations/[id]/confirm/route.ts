import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db
    .update(donations)
    .set({ status: "CONFIRMED", confirmedByAdminId: session.user.id, confirmedAt: new Date() })
    .where(eq(donations.id, Number(id)))

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "DONATION_CONFIRMED", resourceType: "donation", resourceId: id, request: _req })

  return NextResponse.json({ ok: true })
}
