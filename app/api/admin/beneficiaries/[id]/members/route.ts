import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { beneficiaryMembers } from "@/db/schema"
import { requireAdmin } from "@/lib/session"
import { parseId, badRequest, unauthorized, notFound } from "@/lib/http"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const { id: idStr } = await params
  const beneficiaryId = parseId(idStr)
  if (!beneficiaryId) return notFound()

  const body = await req.json().catch(() => null)
  if (!body) return badRequest("Invalid JSON")

  const { name, relation, age, isEarner, isDisabled } = body as Record<string, unknown>

  if (!name || typeof name !== "string" || name.trim() === "") return badRequest("name required")
  if (!relation || typeof relation !== "string" || relation.trim() === "") return badRequest("relation required")
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120)
    return badRequest("age must be an integer 0-120")

  await db.insert(beneficiaryMembers).values({
    beneficiaryId,
    name: name.trim(),
    relation: relation.trim(),
    age,
    isEarner: Boolean(isEarner),
    isDisabled: Boolean(isDisabled),
    updatedAt: new Date(),
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
