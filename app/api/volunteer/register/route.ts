import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { log } from "@/lib/audit"

// Volunteer sign-up in ONE server call. When email verification is enabled there
// is no session right after sign-up, so the client can't call an authenticated
// /become endpoint. We create the account and the volunteer profile together,
// server-side, using the freshly-created user id.
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().optional(),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const { name, email, password, district, upazila, phone } = parsed.data

  // Create the account (Better Auth sends the verification email if enabled).
  let userId: string
  try {
    const res = await auth.api.signUpEmail({ body: { name, email, password } })
    userId = res.user.id
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registration failed." },
      { status: 400 }
    )
  }

  // Promote to volunteer + create the profile.
  try {
    await db.transaction(async (tx) => {
      await tx.update(users).set({ role: "VOLUNTEER", phone: phone ?? null }).where(eq(users.id, userId))
      await tx.insert(volunteerProfiles).values({
        userId,
        district,
        upazila: upazila ?? null,
        kycStatus: "PENDING",
      })
    })
  } catch {
    return NextResponse.json({ error: "Account created but volunteer setup failed." }, { status: 500 })
  }

  await log({
    userId, userName: name, userRole: "VOLUNTEER", action: "VOLUNTEER_BECAME",
    resourceType: "volunteer", resourceId: userId, details: { district, upazila }, request,
  })

  return NextResponse.json({ ok: true })
}
