import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { action, note } = parsed.data

  await db
    .update(volunteerProfiles)
    .set({
      kycStatus: action === "approve" ? "APPROVED" : "REJECTED",
      kycReviewNote: note ?? null,
      kycReviewedAt: new Date(),
      kycReviewedByAdminId: session.user.id,
    })
    .where(eq(volunteerProfiles.id, Number(id)))

  return NextResponse.json({ ok: true })
}
