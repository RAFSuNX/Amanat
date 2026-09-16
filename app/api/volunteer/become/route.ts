import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"

const schema = z.object({
  district: z.string().min(1),
  upazila: z.string().optional(),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { district, upazila, phone } = parsed.data

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ role: "VOLUNTEER", ...(phone ? { phone } : {}) })
      .where(eq(users.id, session.user.id))

    // Idempotent: a double-submit doesn't error or overwrite an existing profile
    // (userId is unique). Becoming a volunteer twice is a no-op, not a 500.
    await tx
      .insert(volunteerProfiles)
      .values({
        userId: session.user.id,
        district,
        upazila: upazila ?? null,
        kycStatus: "PENDING",
      })
      .onConflictDoNothing({ target: volunteerProfiles.userId })
  })

  await log({ userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "VOLUNTEER_BECAME", resourceType: "volunteer", resourceId: session.user.id,
    details: { district, upazila }, request })

  return NextResponse.json({ ok: true })
}
