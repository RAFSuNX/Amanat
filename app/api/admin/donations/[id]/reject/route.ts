import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db
    .update(donations)
    .set({ status: "REJECTED" })
    .where(eq(donations.id, Number(id)))

  return NextResponse.json({ ok: true })
}
