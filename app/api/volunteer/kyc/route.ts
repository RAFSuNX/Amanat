import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { volunteerProfiles, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireVolunteer } from "@/lib/session"
import { log } from "@/lib/audit"

const schema = z.object({
  legalName: z.string().min(1),
  phone: z.string().min(7).max(16).optional(),
  docType: z.enum(["NID", "PASSPORT", "DRIVING_LICENSE"]),
  docNumber: z.string().min(1),
  docImageUrl: z.string().url().optional(),
  passportPhotoUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { legalName, phone, docType, docNumber, docImageUrl, passportPhotoUrl } = parsed.data

  // Update name and phone from KYC submission
  await db.update(users)
    .set({ name: legalName, ...(phone ? { phone } : {}) })
    .where(eq(users.id, session.user.id))

  const existing = await db.query.volunteerProfiles.findFirst({
    where: eq(volunteerProfiles.userId, session.user.id),
  })

  if (existing) {
    await db
      .update(volunteerProfiles)
      .set({
        kycDocType: docType,
        kycDocNumber: docNumber,
        kycDocImageUrl: docImageUrl ?? null,
        passportPhotoUrl: passportPhotoUrl ?? null,
        kycStatus: "PENDING",
        kycReviewNote: null,
        kycReviewedAt: null,
      })
      .where(eq(volunteerProfiles.userId, session.user.id))
  } else {
    await db.insert(volunteerProfiles).values({
      userId: session.user.id,
      district: "Unknown",
      kycDocType: docType,
      kycDocNumber: docNumber,
      kycDocImageUrl: docImageUrl ?? null,
      passportPhotoUrl: passportPhotoUrl ?? null,
      kycStatus: "PENDING",
    })
  }

  await log({ userId: session.user.id, userName: session.user.name, userRole: "VOLUNTEER",
    action: "KYC_SUBMITTED", resourceType: "volunteer", resourceId: session.user.id,
    details: { docType }, request })

  return NextResponse.json({ ok: true })
}
