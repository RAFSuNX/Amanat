import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionCycles } from "@/db/schema"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { createCycleSchema } from "@/lib/contracts"

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = createCycleSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { period, totalPool, specialDeductionTotal, notes } = parsed.data

  if (specialDeductionTotal > totalPool) {
    return NextResponse.json(
      { error: "Special deduction cannot exceed the total pool." },
      { status: 400 }
    )
  }

  try {
    const [cycle] = await db
      .insert(distributionCycles)
      .values({
        period,
        totalPool: totalPool.toFixed(2),
        specialDeductionTotal: specialDeductionTotal.toFixed(2),
        notes: notes ?? null,
        status: "DRAFT",
        createdByAdminId: session.user.id,
      })
      .returning({ id: distributionCycles.id })

    await log({
      userId: session.user.id, userName: session.user.name, userRole: "ADMIN",
      action: "DISTRIBUTION_CYCLE_CREATED", resourceType: "distribution", resourceId: cycle.id,
      details: { period, totalPool, specialDeductionTotal }, request: req,
    })

    return NextResponse.json({ id: cycle.id })
  } catch {
    // period is unique - duplicate month is the likely cause
    return NextResponse.json(
      { error: `A cycle for ${period} already exists.` },
      { status: 409 }
    )
  }
}
