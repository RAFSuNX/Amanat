import { NextResponse } from "next/server"
import { db } from "@/db"
import { beneficiaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"

export async function GET() {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db.query.beneficiaries.findMany({
    where: and(
      eq(beneficiaries.registeredByVolunteerId, session.user.id),
      eq(beneficiaries.status, "ACTIVE")
    ),
    columns: { id: true, name: true },
  })

  return NextResponse.json(rows)
}
