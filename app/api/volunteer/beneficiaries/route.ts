import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { beneficiaries, beneficiaryMembers, needAssessments } from "@/db/schema"
import { requireVolunteer } from "@/lib/session"

const memberSchema = z.object({
  name: z.string().min(1),
  relation: z.string().min(1),
  age: z.coerce.number().int().min(0).max(120),
  isDisabled: z.boolean().default(false),
  isEarner: z.boolean().default(false),
})

const schema = z.object({
  // Personal
  name: z.string().min(1),
  phone: z.string().optional(),
  nidNumber: z.string().optional(),
  photoUrl: z.string().url().optional(),
  type: z.enum(["INDIVIDUAL", "FAMILY"]),
  // Address
  division: z.string().min(1),
  district: z.string().min(1),
  upazila: z.string().optional(),
  union: z.string().optional(),
  village: z.string().optional(),
  // Members
  members: z.array(memberSchema).min(1),
  // Need
  declaredMonthlyNeed: z.coerce.number().positive(),
  assessmentNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const d = parsed.data
  const period = new Date().toISOString().slice(0, 7) // YYYY-MM

  await db.transaction(async (tx) => {
    const [ben] = await tx
      .insert(beneficiaries)
      .values({
        registeredByVolunteerId: session.user.id,
        name: d.name,
        phone: d.phone ?? null,
        nidNumber: d.nidNumber ?? null,
        photoUrl: d.photoUrl ?? null,
        type: d.type,
        division: d.division,
        district: d.district,
        upazila: d.upazila ?? null,
        union: d.union ?? null,
        village: d.village ?? null,
        status: "PENDING",
      })
      .returning({ id: beneficiaries.id })

    const benId = ben.id

    await tx.insert(beneficiaryMembers).values(
      d.members.map((m) => ({
        beneficiaryId: benId,
        name: m.name,
        relation: m.relation,
        age: m.age,
        isDisabled: m.isDisabled,
        isEarner: m.isEarner,
      }))
    )

    await tx.insert(needAssessments).values({
      beneficiaryId: benId,
      assessedByVolunteerId: session.user.id,
      period,
      declaredMonthlyNeed: d.declaredMonthlyNeed.toFixed(2),
      notes: d.assessmentNotes ?? null,
      status: "ACTIVE",
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
