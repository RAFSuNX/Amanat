import { db } from "@/db"
import {
  beneficiaries,
  distributionAllotments,
  distributionCycles,
} from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

type MemberRow = { age: number; isDisabled: boolean; isEarner: boolean }

export function calcWeightedScore(
  declaredNeed: number,
  members: MemberRow[]
): number {
  const total = members.length || 1
  const children = members.filter((m) => m.age < 12).length
  const elderly = members.filter((m) => m.age >= 60).length
  const disabled = members.filter((m) => m.isDisabled).length
  const earners = members.filter((m) => m.isEarner).length

  const familyFactor = 1 + total * 0.1
  const childrenBonus = children * 0.15
  const elderlyBonus = elderly * 0.1
  const disabilityBonus = disabled * 0.3
  const noEarnerBonus = earners === 0 ? 0.2 : 0

  return (
    declaredNeed *
    (familyFactor + childrenBonus + elderlyBonus + disabilityBonus + noEarnerBonus)
  )
}

// Thrown when the cycle isn't in the state this operation requires. The route
// maps it to a 409 instead of a raw 500.
export class CycleStateError extends Error {}

// Atomic: the whole calculation (lock the cycle, wipe old draft allotments,
// insert the new ones, advance status) runs in one transaction. A FOR UPDATE lock
// on the cycle row serialises concurrent calculates, and a crash mid-way rolls the
// whole thing back - never a half-built allotment set.
export async function calculateDistribution(cycleId: number) {
  return await db.transaction(async (tx) => {
    const [cycle] = await tx
      .select()
      .from(distributionCycles)
      .where(eq(distributionCycles.id, cycleId))
      .for("update")
    if (!cycle) throw new CycleStateError("Cycle not found")
    if (cycle.status !== "DRAFT")
      throw new CycleStateError("Cycle must be in DRAFT status")

    // APPROVED = passed admin review; ACTIVE = already received in a prior cycle.
    // Both remain eligible each month.
    const activeBeneficiaries = await tx.query.beneficiaries.findMany({
      where: inArray(beneficiaries.status, ["APPROVED", "ACTIVE"]),
      with: { members: true, needAssessments: true },
    })

    const period = cycle.period
    type BeneficiaryWithData = (typeof activeBeneficiaries)[0]
    const rows: Array<{ beneficiary: BeneficiaryWithData; need: number; score: number }> = []

    for (const b of activeBeneficiaries) {
      // Most recent active assessment for this period, else the latest active one.
      const assessment =
        b.needAssessments.find((a) => a.period === period && a.status === "ACTIVE") ??
        b.needAssessments
          .filter((a) => a.status === "ACTIVE")
          .sort((a, c) => new Date(c.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      if (!assessment) continue

      const need = parseFloat(assessment.declaredMonthlyNeed)
      const score = calcWeightedScore(need, b.members)
      rows.push({ beneficiary: b, need, score })
    }

    const totalScore = rows.reduce((sum, r) => sum + r.score, 0)
    const specialDeduction = parseFloat(cycle.specialDeductionTotal ?? "0")
    const pool = parseFloat(cycle.totalPool) - specialDeduction
    const remainingPool = Math.max(pool, 0)

    // Build the allotment rows (so the exact per-family numbers can be both
    // persisted and returned for the audit trail).
    const allotmentValues =
      rows.length > 0 && totalScore > 0
        ? rows.map((r) => {
            const rawAlloc = (r.score / totalScore) * remainingPool
            const allocated = Math.min(rawAlloc, r.need) // cap at declared need
            return {
              cycleId,
              beneficiaryId: r.beneficiary.id,
              requestedAmount: r.need.toFixed(2),
              allocatedAmount: allocated.toFixed(2),
              weightedScore: r.score.toFixed(4),
              deliveryStatus: "PENDING" as const,
            }
          })
        : []

    // Replace any previous draft allotments for this cycle.
    await tx.delete(distributionAllotments).where(eq(distributionAllotments.cycleId, cycleId))
    if (allotmentValues.length > 0)
      await tx.insert(distributionAllotments).values(allotmentValues)

    await tx
      .update(distributionCycles)
      .set({ status: "VOLUNTEER_REVIEW", remainingPool: remainingPool.toFixed(2) })
      .where(eq(distributionCycles.id, cycleId))

    const totalAllocated = allotmentValues.reduce((s, a) => s + parseFloat(a.allocatedAmount), 0)
    return {
      families: allotmentValues.length,
      pool: +remainingPool.toFixed(2),
      totalAllocated: +totalAllocated.toFixed(2),
      breakdown: allotmentValues.map((a) => ({
        beneficiaryId: a.beneficiaryId,
        allocated: +a.allocatedAmount,
      })),
    }
  })
}
