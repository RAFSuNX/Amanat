import { db } from "@/db"
import {
  beneficiaries,
  beneficiaryMembers,
  needAssessments,
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

export async function calculateDistribution(cycleId: number) {
  const cycle = await db.query.distributionCycles.findFirst({
    where: eq(distributionCycles.id, cycleId),
  })
  if (!cycle) throw new Error("Cycle not found")
  if (cycle.status !== "DRAFT") throw new Error("Cycle must be in DRAFT status")

  // Fetch all beneficiaries eligible for distribution.
  // APPROVED = passed admin review; ACTIVE = already received in a prior cycle.
  // Both remain eligible each month.
  const activeBeneficiaries = await db.query.beneficiaries.findMany({
    where: inArray(beneficiaries.status, ["APPROVED", "ACTIVE"]),
    with: { members: true, needAssessments: true },
  })

  const period = cycle.period

  type BeneficiaryWithData = (typeof activeBeneficiaries)[0]

  const rows: Array<{
    beneficiary: BeneficiaryWithData
    need: number
    score: number
  }> = []

  for (const b of activeBeneficiaries) {
    // Use most recent active assessment for this period or latest
    const assessment =
      b.needAssessments.find(
        (a) => a.period === period && a.status === "ACTIVE"
      ) ??
      b.needAssessments
        .filter((a) => a.status === "ACTIVE")
        .sort(
          (a, c) => new Date(c.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]

    if (!assessment) continue

    const need = parseFloat(assessment.declaredMonthlyNeed)
    const score = calcWeightedScore(need, b.members)
    rows.push({ beneficiary: b, need, score })
  }

  const totalScore = rows.reduce((sum, r) => sum + r.score, 0)
  const specialDeduction = parseFloat(cycle.specialDeductionTotal ?? "0")
  const pool = parseFloat(cycle.totalPool) - specialDeduction
  const remainingPool = Math.max(pool, 0)

  // Delete any previous draft allotments for this cycle
  await db
    .delete(distributionAllotments)
    .where(eq(distributionAllotments.cycleId, cycleId))

  // Insert allotments
  if (rows.length > 0 && totalScore > 0) {
    await db.insert(distributionAllotments).values(
      rows.map((r) => {
        const rawAlloc =
          totalScore > 0 ? (r.score / totalScore) * remainingPool : 0
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
    )
  }

  await db
    .update(distributionCycles)
    .set({
      status: "VOLUNTEER_REVIEW",
      remainingPool: remainingPool.toFixed(2),
    })
    .where(eq(distributionCycles.id, cycleId))
}
