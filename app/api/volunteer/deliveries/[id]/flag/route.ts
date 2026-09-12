import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionAllotments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { note } = await request.json()

  await db
    .update(distributionAllotments)
    .set({ isFlagged: true, volunteerFlagNote: note ?? null, reviewedByVolunteerId: session.user.id })
    .where(eq(distributionAllotments.id, Number(id)))

  return NextResponse.json({ ok: true })
}
