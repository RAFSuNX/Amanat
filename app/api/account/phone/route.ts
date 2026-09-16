import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"

const schema = z.object({
  phone: z.string().min(7).max(16), // allow 01XXXXXXXXX and +8801XXXXXXXXX formats
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 })
  }

  await db
    .update(users)
    .set({ phone: parsed.data.phone })
    .where(eq(users.id, session.user.id))

  await log({ userId: session.user.id, userName: session.user.name,
    action: "PHONE_UPDATED", resourceType: "user", resourceId: session.user.id, request })

  return NextResponse.json({ ok: true })
}
