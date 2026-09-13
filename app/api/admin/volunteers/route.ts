import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { users, accounts, volunteerProfiles } from "@/db/schema"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { hash } from "bcryptjs"
import { randomUUID } from "crypto"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  district: z.string().min(1),
  upazila: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, phone, password, district, upazila } = parsed.data

  const userId = randomUUID()
  const hashedPassword = await hash(password, 10)

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        phone: phone ?? null,
        role: "VOLUNTEER",
        emailVerified: true, // admin-created accounts are pre-verified
      })

      await tx.insert(accounts).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
      })

      await tx.insert(volunteerProfiles).values({
        userId,
        district,
        upazila: upazila ?? null,
        kycStatus: "PENDING",
      })
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create volunteer." }, { status: 500 })
  }

  await log({ userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
    action: "VOLUNTEER_CREATED", resourceType: "volunteer", resourceId: userId,
    details: { name, email, district } })

  return NextResponse.json({ ok: true }, { status: 201 })
}
