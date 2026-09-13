import { describe, it, expect } from "vitest"
import {
  CYCLE_ACTIONS, isCycleAction, createCycleSchema, overrideSchema, volunteerRequestSchema,
} from "@/lib/contracts"

// The point of these tests: the API accepts exactly what we designed and nothing
// else. "activate" is valid; "ACTIVATE", "Activate", aliases and typos are not.
describe("cycle action contract (exact, no case-folding, no fallback)", () => {
  it("is exactly the five defined actions", () => {
    expect([...CYCLE_ACTIONS]).toEqual(["calculate", "close-review", "override", "activate", "complete"])
  })
  it("accepts the exact lowercase action", () => {
    expect(isCycleAction("activate")).toBe(true)
  })
  it("rejects different casing", () => {
    expect(isCycleAction("ACTIVATE")).toBe(false)
    expect(isCycleAction("Activate")).toBe(false)
  })
  it("rejects unknown or empty actions and non-strings", () => {
    for (const v of ["approve", "", "activated", " activate", undefined, null, 1, {}])
      expect(isCycleAction(v)).toBe(false)
  })
})

describe("createCycleSchema", () => {
  it("accepts a valid cycle and coerces the numeric pool", () => {
    const r = createCycleSchema.safeParse({ period: "2026-03", totalPool: "250000" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.totalPool).toBe(250000)
      expect(r.data.specialDeductionTotal).toBe(0) // default
    }
  })
  it("rejects malformed periods", () => {
    for (const period of ["2026-3", "202603", "march", "2026/03", ""])
      expect(createCycleSchema.safeParse({ period, totalPool: 1000 }).success).toBe(false)
  })
  it("rejects a non-positive pool", () => {
    expect(createCycleSchema.safeParse({ period: "2026-03", totalPool: 0 }).success).toBe(false)
    expect(createCycleSchema.safeParse({ period: "2026-03", totalPool: -5 }).success).toBe(false)
  })
})

describe("overrideSchema", () => {
  it("accepts a whole-number id and a zero-or-more amount", () => {
    expect(overrideSchema.safeParse({ allotmentId: 3, amount: 0 }).success).toBe(true)
    expect(overrideSchema.safeParse({ allotmentId: "3", amount: "150.50" }).success).toBe(true)
  })
  it("rejects a negative amount or a non-integer id", () => {
    expect(overrideSchema.safeParse({ allotmentId: 3, amount: -1 }).success).toBe(false)
    expect(overrideSchema.safeParse({ allotmentId: 1.5, amount: 10 }).success).toBe(false)
    expect(overrideSchema.safeParse({ allotmentId: 0, amount: 10 }).success).toBe(false)
  })
})

describe("volunteerRequestSchema", () => {
  it("requires a real reason", () => {
    expect(volunteerRequestSchema.safeParse({ note: "" }).success).toBe(false)
    expect(volunteerRequestSchema.safeParse({ note: "ok" }).success).toBe(false)
    expect(volunteerRequestSchema.safeParse({ note: "needs more this month" }).success).toBe(true)
  })
  it("keeps amount optional but validates a receipt URL when given", () => {
    expect(volunteerRequestSchema.safeParse({ note: "reason here" }).success).toBe(true)
    expect(volunteerRequestSchema.safeParse({ note: "reason here", receiptUrl: "not-a-url" }).success).toBe(false)
    expect(volunteerRequestSchema.safeParse({ note: "reason here", receiptUrl: "https://x.io/r.jpg" }).success).toBe(true)
  })
})
