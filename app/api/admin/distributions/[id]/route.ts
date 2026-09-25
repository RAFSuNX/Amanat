import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { distributionCycles, distributionAllotments, beneficiaries } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { log } from "@/lib/audit"
import { calculateDistribution, CycleStateError } from "@/lib/distribution"
import { isCycleAction, overrideSchema } from "@/lib/contracts"
import { sumFinal, poolCap, exceedsPool, reconciles } from "@/lib/allotment"
import { badRequest, conflict, parseId, unauthorized } from "@/lib/http"

// Cycle status transitions are done atomically: the required current status is in
// the UPDATE's WHERE, so two concurrent callers can't both pass a check-then-act
// race - exactly one row updates, the loser gets a 409.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const cycleId = parseId((await params).id)
  if (cycleId === null) return badRequest("Invalid cycle id")
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
        return badRequest("Cycle must be in DRAFT to calculate.")
      // The heavy lifting is one transaction (see calculateDistribution). The
      // CycleStateError catch covers the race where it stopped being DRAFT
      // between the check above and the locked read inside the transaction.
      let summary
      try {
        summary = await calculateDistribution(cycleId)
      } catch (e) {
        if (e instanceof CycleStateError) return conflict(e.message)
        throw e
      }
      await log({ ...actor, action: "DISTRIBUTION_CALCULATED", resourceType: "distribution",
        resourceId: cycleId, details: { period: cycle.period, ...summary }, request: req })
      return NextResponse.json({ ok: true })
    }

    // ── VOLUNTEER_REVIEW → ADMIN_REVIEW ───────────────────────────────────────
    case "close-review": {
      const [row] = await db.update(distributionCycles).set({ status: "ADMIN_REVIEW" })
        .where(and(eq(distributionCycles.id, cycleId), eq(distributionCycles.status, "VOLUNTEER_REVIEW")))
        .returning({ id: distributionCycles.id })
      if (!row) return conflict("Cycle is not in volunteer review.")
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
      // One transaction, all-or-nothing: lock the cycle (FOR UPDATE) and verify
      // ADMIN_REVIEW, re-read allotments under the lock, enforce the pool cap, then
      // set the DERIVED remainingPool, lock in override amounts, and mark families.
      // The transaction RETURNS its outcome (clean type narrowing at the call site).
      const result = await db.transaction(async (tx) => {
        const [claimed] = await tx
          .select({ id: distributionCycles.id })
          .from(distributionCycles)
          .where(and(eq(distributionCycles.id, cycleId), eq(distributionCycles.status, "ADMIN_REVIEW")))
          .for("update")
        if (!claimed) return { status: "conflict" as const }

        const allotments = await tx.query.distributionAllotments.findMany({
          where: eq(distributionAllotments.cycleId, cycleId),
        })
        const cap = poolCap(cycle.totalPool, cycle.specialDeductionTotal)
        const totalFinal = sumFinal(allotments)
        // No writes yet - returning just commits a no-op transaction.
        if (exceedsPool(totalFinal, cap)) return { status: "over" as const, totalFinal, cap }

        await tx.update(distributionCycles).set({
          status: "ACTIVE",
          activatedAt: new Date(),
          remainingPool: (cap - totalFinal).toFixed(2),
        }).where(eq(distributionCycles.id, cycleId))

        // Lock in final amounts: overrides become the authoritative allocated_amount.
        for (const a of allotments)
          if (a.manualOverrideAmount != null)
            await tx.update(distributionAllotments)
              .set({ allocatedAmount: a.manualOverrideAmount })
              .where(eq(distributionAllotments.id, a.id))

        const benIds = [...new Set(allotments.map((a) => a.beneficiaryId))]
        if (benIds.length > 0)
          await tx.update(beneficiaries).set({ status: "ACTIVE" })
            .where(and(inArray(beneficiaries.id, benIds), eq(beneficiaries.status, "APPROVED")))

        return { status: "ok" as const, families: benIds.length, totalFinal, cap }
      })

      if (result.status === "conflict") return conflict("Cycle must be in admin review to activate.")
      if (result.status === "over")
        return NextResponse.json({
          error: `Total allocation (${result.totalFinal.toFixed(2)} BDT) exceeds the available pool (${result.cap.toFixed(2)} BDT). Reduce amounts before activating.`,
          totalFinal: result.totalFinal, cap: result.cap,
        }, { status: 400 })

      await log({ ...actor, action: "DISTRIBUTION_ACTIVATED", resourceType: "distribution",
        resourceId: cycleId,
        details: { period: cycle.period, families: result.families, totalDistributed: result.totalFinal,
          pool: result.cap, remaining: +(result.cap - result.totalFinal).toFixed(2) },
        request: req })
      return NextResponse.json({ ok: true })
    }

    // ── ACTIVE → COMPLETED (published to public ledger) ───────────────────────
    case "complete": {
      // Re-read allotments inside the transaction and verify money conservation
      // before publishing. Guards against manual DB edits between activate and complete.
      const allotments = await db.query.distributionAllotments.findMany({
        where: eq(distributionAllotments.cycleId, cycleId),
      })
      const cap = poolCap(cycle.totalPool, cycle.specialDeductionTotal)
      const totalFinal = sumFinal(allotments)
      const remaining = parseFloat(cycle.remainingPool ?? "0")
      if (!reconciles(cap, totalFinal, remaining))
        return conflict(`Money conservation violated: pool=${cap}, distributed=${totalFinal.toFixed(2)}, remaining=${remaining}. Do not complete.`)

      const [row] = await db.update(distributionCycles).set({ status: "COMPLETED", completedAt: new Date() })
        .where(and(eq(distributionCycles.id, cycleId), eq(distributionCycles.status, "ACTIVE")))
        .returning({ id: distributionCycles.id })
      if (!row) return conflict("Only active cycles can be completed.")
      await log({ ...actor, action: "DISTRIBUTION_COMPLETED", resourceType: "distribution",
        resourceId: cycleId, details: { period: cycle.period, totalDistributed: totalFinal.toFixed(2) }, request: req })
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
}
