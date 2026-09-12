import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/session"

const schema = z.object({
  phone: z.string().min(7).max(16), // allow 01XXXXXXXXX and +8801XXXXXXXXX formats
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 })
  }

  await db
    .update(users)
    .set({ phone: parsed.data.phone })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
