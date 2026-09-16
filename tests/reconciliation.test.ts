import { describe, it, expect } from "vitest"
import { poolCap, sumFinal, reconciles } from "@/lib/allotment"

// Money conservation: for an activated cycle, spent + remaining must equal the
// pool available. This is the guard against a "10 in, 3 spent, shows 5" drift.
describe("reconciles (money conservation)", () => {
  it("balances when remaining is derived as cap - spent", () => {
    const cap = poolCap("1000.00", "0")
    const totalFinal = sumFinal([
      { allocatedAmount: "300.00", manualOverrideAmount: null },
      { allocatedAmount: "200.00", manualOverrideAmount: null },
    ])
    const remaining = cap - totalFinal // exactly how activate derives it
    expect(reconciles(cap, totalFinal, remaining)).toBe(true)
    expect(remaining).toBe(500)
  })

  it("still balances with the special-needs reserve removed from the pool", () => {
    const cap = poolCap("1000.00", "250.00") // 750 available for regular allotments
    const totalFinal = sumFinal([{ allocatedAmount: "750.00", manualOverrideAmount: null }])
    expect(reconciles(cap, totalFinal, cap - totalFinal)).toBe(true)
  })

  it("absorbs sub-cent float rounding", () => {
    expect(reconciles(100, 33.34, 66.66)).toBe(true)
  })

  it("flags a tampered remaining (spent 3 of 10 but books claim 5 left)", () => {
    expect(reconciles(10, 3, 5)).toBe(false)
  })
})
