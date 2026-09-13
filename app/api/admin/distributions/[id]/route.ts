import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionCycles, distributionAllotments, beneficiaries } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { calculateDistribution } from "@/lib/distribution"
import { isCycleAction, overrideSchema } from "@/lib/contracts"
import { sumFinal, poolCap, exceedsPool } from "@/lib/allotment"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const cycleId = Number(id)
  const body = await req.json().catch(() => ({}))

  // Exact contract: only the defined actions are accepted, matched literally.
  if (!isCycleAction(body.action))
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  const action = body.action

  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, cycleId),
  })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })

  const actor = { userId: session.user.id, userName: session.user.name, userRole: "ADMIN" as const }

  switch (action) {
    // ── DRAFT → VOLUNTEER_REVIEW ──────────────────────────────────────────────
    case "calculate": {
      if (cycle.status !== "DRAFT")
        return NextResponse.json({ error: "Cycle must be in DRAFT to calculate." }, { status: 400 })
      await calculateDistribution(cycleId)
      await log({ ...actor, action: "DISTRIBUTION_CALCULATED", resourceType: "distribution",
        resourceId: cycleId, details: { period: cycle.period }, request: req })
      return NextResponse.json({ ok: true })
    }

    // ── VOLUNTEER_REVIEW → ADMIN_REVIEW ───────────────────────────────────────
    case "close-review": {
      if (cycle.status !== "VOLUNTEER_REVIEW")
        return NextResponse.json({ error: "Cycle is not in volunteer review." }, { status: 400 })
      await db.update(distributionCycles).set({ status: "ADMIN_REVIEW" })
        .where(eq(distributionCycles.id, cycleId))
      await log({ ...actor, action: "DISTRIBUTION_REVIEW_CLOSED", resourceType: "distribution",
        resourceId: cycleId, details: { period: cycle.period }, request: req })
      return NextResponse.json({ ok: true })
    }

    // ── Admin sets a custom amount on one allotment (during ADMIN_REVIEW) ──────
    case "override": {
      if (cycle.status !== "ADMIN_REVIEW")
        return NextResponse.json({ error: "Overrides are only allowed during admin review." }, { status: 400 })
      const parsed = overrideSchema.safeParse(body)
      if (!parsed.success)
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      const { allotmentId, amount } = parsed.data

      const allotment = await db.query.distributionAllotments.findFirst({
        where: and(
          eq(distributionAllotments.id, allotmentId),
          eq(distributionAllotments.cycleId, cycleId)
        ),
      })
      if (!allotment) return NextResponse.json({ error: "Allotment not found" }, { status: 404 })

      await db.update(distributionAllotments)
        .set({ manualOverrideAmount: amount.toFixed(2), overrideByAdminId: session.user.id })
        .where(eq(distributionAllotments.id, allotmentId))

      await log({ ...actor, action: "ALLOTMENT_OVERRIDDEN", resourceType: "allotment",
        resourceId: allotmentId,
        details: {
          beneficiaryId: allotment.beneficiaryId,
          from: parseFloat(allotment.allocatedAmount ?? "0"),
          to: amount,
          volunteerRequested: allotment.volunteerRequestedAmount
            ? parseFloat(allotment.volunteerRequestedAmount) : null,
        }, request: req })
      return NextResponse.json({ ok: true })
    }

    // ── ADMIN_REVIEW → ACTIVE (hard-block over pool) ──────────────────────────
    case "activate": {
      if (cycle.status !== "ADMIN_REVIEW")
        return NextResponse.json({ error: "Cycle must be in admin review to activate." }, { status: 400 })

      const allotments = await db.query.distributionAllotments.findMany({
        where: eq(distributionAllotments.cycleId, cycleId),
      })
      const cap = poolCap(cycle.totalPool, cycle.specialDeductionTotal)
      const totalFinal = sumFinal(allotments)

      if (exceedsPool(totalFinal, cap)) {
        return NextResponse.json({
          error: `Total allocation (${totalFinal.toFixed(2)} BDT) exceeds the available pool (${cap.toFixed(2)} BDT). Reduce amounts before activating.`,
          totalFinal, cap,
        }, { status: 400 })
      }

      // Lock in final amounts: overrides become the authoritative allocated_amount
      // (this is the number the public ledger and delivery screens read).
      for (const a of allotments) {
        if (a.manualOverrideAmount != null)
          await db.update(distributionAllotments)
            .set({ allocatedAmount: a.manualOverrideAmount })
            .where(eq(distributionAllotments.id, a.id))
      }

      await db.update(distributionCycles).set({
        status: "ACTIVE",
        activatedAt: new Date(),
        remainingPool: (cap - totalFinal).toFixed(2),
      }).where(eq(distributionCycles.id, cycleId))

      // Mark participating families ACTIVE (they've entered the distribution).
      const benIds = [...new Set(allotments.map((a) => a.beneficiaryId))]
      if (benIds.length > 0)
        await db.update(beneficiaries).set({ status: "ACTIVE" })
          .where(and(inArray(beneficiaries.id, benIds), eq(beneficiaries.status, "APPROVED")))

      await log({ ...actor, action: "DISTRIBUTION_ACTIVATED", resourceType: "distribution",
        resourceId: cycleId,
        details: { period: cycle.period, families: benIds.length, totalDistributed: totalFinal, pool: cap },
        request: req })
      return NextResponse.json({ ok: true })
    }

    // ── ACTIVE → COMPLETED (published to public ledger) ───────────────────────
    case "complete": {
      if (cycle.status !== "ACTIVE")
        return NextResponse.json({ error: "Only active cycles can be completed." }, { status: 400 })
      await db.update(distributionCycles).set({ status: "COMPLETED", completedAt: new Date() })
        .where(eq(distributionCycles.id, cycleId))
      await log({ ...actor, action: "DISTRIBUTION_COMPLETED", resourceType: "distribution",
        resourceId: cycleId, details: { period: cycle.period }, request: req })
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
}
