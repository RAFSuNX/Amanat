import { describe, it, expect, beforeAll, vi } from "vitest"
import { sql, eq, and, inArray } from "drizzle-orm"

// Real-postgres integration. Runs ONLY when TEST_DATABASE_URL is set (CI service
// or a local throwaway DB) so it can never touch a real database by accident.
// It TRUNCATEs, so the target must be disposable.
const RUN = !!process.env.TEST_DATABASE_URL
const suite = RUN ? describe : describe.skip

// The activate handler pulls the admin session and writes an audit log; stub both.
vi.mock("@/lib/session", () => ({
  requireAdmin: async () => ({ user: { id: "admin1", name: "Admin", role: "ADMIN" } }),
  requireVolunteer: async () => ({ user: { id: "vol1", name: "Vol", role: "VOLUNTEER" } }),
  getSession: async () => ({ user: { id: "admin1", name: "Admin", role: "ADMIN" } }),
}))
vi.mock("@/lib/audit", () => ({ log: async () => {} }))

suite("distribution lifecycle (real postgres)", () => {
  let db: any, schema: any, calc: any, POST: any
  const period = "2026-01"
  let cycleId: number, benAId: number, benBId: number

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
    const { migrate } = await import("drizzle-orm/postgres-js/migrator")
    schema = await import("@/db/schema")
    ;({ db } = await import("@/db"))
    ;({ calculateDistribution: calc } = await import("@/lib/distribution"))
    ;({ POST } = await import("@/app/api/admin/distributions/[id]/route"))

    await migrate(db, { migrationsFolder: "db/migrations" })
    await db.execute(sql`TRUNCATE distribution_allotments, distribution_cycles, need_assessments, beneficiary_members, beneficiaries, users RESTART IDENTITY CASCADE`)

    await db.insert(schema.users).values([
      { id: "admin1", email: "a@x.io", name: "Admin", role: "ADMIN" },
      { id: "vol1", email: "v@x.io", name: "Vol", role: "VOLUNTEER" },
    ])

    // Fam A: high need, no earner, two children -> high weighted score.
    ;[{ id: benAId }] = await db.insert(schema.beneficiaries)
      .values({ registeredByVolunteerId: "vol1", name: "Fam A", type: "FAMILY", district: "Dhaka", status: "APPROVED" })
      .returning({ id: schema.beneficiaries.id })
    await db.insert(schema.beneficiaryMembers).values([
      { beneficiaryId: benAId, name: "p1", relation: "self", age: 40, isEarner: false, isDisabled: false },
      { beneficiaryId: benAId, name: "p2", relation: "spouse", age: 38, isEarner: false, isDisabled: false },
      { beneficiaryId: benAId, name: "c1", relation: "child", age: 8, isEarner: false, isDisabled: false },
      { beneficiaryId: benAId, name: "c2", relation: "child", age: 5, isEarner: false, isDisabled: false },
    ])
    await db.insert(schema.needAssessments).values({ beneficiaryId: benAId, assessedByVolunteerId: "vol1", period, declaredMonthlyNeed: "5000.00", status: "ACTIVE" })

    // Fam B: low need, single earner -> low weighted score.
    ;[{ id: benBId }] = await db.insert(schema.beneficiaries)
      .values({ registeredByVolunteerId: "vol1", name: "Fam B", type: "INDIVIDUAL", district: "Dhaka", status: "APPROVED" })
      .returning({ id: schema.beneficiaries.id })
    await db.insert(schema.beneficiaryMembers).values([
      { beneficiaryId: benBId, name: "p1", relation: "self", age: 35, isEarner: true, isDisabled: false },
    ])
    await db.insert(schema.needAssessments).values({ beneficiaryId: benBId, assessedByVolunteerId: "vol1", period, declaredMonthlyNeed: "2000.00", status: "ACTIVE" })

    ;[{ id: cycleId }] = await db.insert(schema.distributionCycles)
      .values({ period, totalPool: "6000.00", createdByAdminId: "admin1", status: "DRAFT" })
      .returning({ id: schema.distributionCycles.id })
  })

  it("calculate: splits proportionally, never over pool or declared need, opens review", async () => {
    await calc(cycleId)
    const rows = await db.select().from(schema.distributionAllotments)
      .where(eq(schema.distributionAllotments.cycleId, cycleId))

    expect(rows.length).toBe(2)
    const total = rows.reduce((s: number, r: any) => s + parseFloat(r.allocatedAmount), 0)
    expect(total).toBeLessThanOrEqual(6000.01)
    for (const r of rows)
      expect(parseFloat(r.allocatedAmount)).toBeLessThanOrEqual(parseFloat(r.requestedAmount) + 0.01)

    const a = rows.find((r: any) => r.beneficiaryId === benAId)
    const b = rows.find((r: any) => r.beneficiaryId === benBId)
    expect(parseFloat(a.allocatedAmount)).toBeGreaterThan(parseFloat(b.allocatedAmount))

    const [cyc] = await db.select().from(schema.distributionCycles).where(eq(schema.distributionCycles.id, cycleId))
    expect(cyc.status).toBe("VOLUNTEER_REVIEW")
  })

  it("activate: hard-blocks when an override pushes total over the pool", async () => {
    await db.update(schema.distributionCycles).set({ status: "ADMIN_REVIEW" }).where(eq(schema.distributionCycles.id, cycleId))
    await db.update(schema.distributionAllotments)
      .set({ manualOverrideAmount: "100000.00" })
      .where(and(eq(schema.distributionAllotments.cycleId, cycleId), eq(schema.distributionAllotments.beneficiaryId, benAId)))

    const res = await POST(
      new Request("http://t/api", { method: "POST", body: JSON.stringify({ action: "activate" }), headers: { "content-type": "application/json" } }),
      { params: Promise.resolve({ id: String(cycleId) }) }
    )
    expect(res.status).toBe(400)
    const [cyc] = await db.select().from(schema.distributionCycles).where(eq(schema.distributionCycles.id, cycleId))
    expect(cyc.status).toBe("ADMIN_REVIEW") // unchanged
  })

  it("activate: succeeds within pool and flips participating families to ACTIVE", async () => {
    await db.update(schema.distributionAllotments).set({ manualOverrideAmount: null })
      .where(eq(schema.distributionAllotments.cycleId, cycleId))

    const res = await POST(
      new Request("http://t/api", { method: "POST", body: JSON.stringify({ action: "activate" }), headers: { "content-type": "application/json" } }),
      { params: Promise.resolve({ id: String(cycleId) }) }
    )
    expect(res.status).toBe(200)

    const [cyc] = await db.select().from(schema.distributionCycles).where(eq(schema.distributionCycles.id, cycleId))
    expect(cyc.status).toBe("ACTIVE")
    expect(cyc.activatedAt).not.toBeNull()

    const bens = await db.select().from(schema.beneficiaries)
      .where(inArray(schema.beneficiaries.id, [benAId, benBId]))
    for (const b of bens) expect(b.status).toBe("ACTIVE")
  })

  it("rejects an unknown action verbatim (approve is not a real action)", async () => {
    const res = await POST(
      new Request("http://t/api", { method: "POST", body: JSON.stringify({ action: "approve" }), headers: { "content-type": "application/json" } }),
      { params: Promise.resolve({ id: String(cycleId) }) }
    )
    expect(res.status).toBe(400)
  })
})
