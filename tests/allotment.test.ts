import { describe, it, expect } from "vitest"
import { finalAmount, sumFinal, poolCap, exceedsPool } from "@/lib/allotment"

describe("finalAmount", () => {
  it("prefers the admin override over the calculated allocation", () => {
    expect(finalAmount({ allocatedAmount: "500.00", manualOverrideAmount: "800.00" })).toBe(800)
  })
  it("falls back to the allocated amount only when there is no override", () => {
    expect(finalAmount({ allocatedAmount: "500.00", manualOverrideAmount: null })).toBe(500)
  })
  it("is zero when neither is set", () => {
    expect(finalAmount({ allocatedAmount: null, manualOverrideAmount: null })).toBe(0)
  })
  it("treats an override of 0 as a real 0, not a fallback to allocated", () => {
    expect(finalAmount({ allocatedAmount: "500.00", manualOverrideAmount: "0.00" })).toBe(0)
  })
})

describe("sumFinal", () => {
  it("sums the authoritative amount across rows", () => {
    expect(sumFinal([
      { allocatedAmount: "100.00", manualOverrideAmount: null },
      { allocatedAmount: "100.00", manualOverrideAmount: "250.00" },
      { allocatedAmount: null, manualOverrideAmount: null },
    ])).toBe(350)
  })
})

describe("poolCap", () => {
  it("subtracts the special-needs reserve", () => {
    expect(poolCap("100000.00", "20000.00")).toBe(80000)
  })
  it("treats a null reserve as zero", () => {
    expect(poolCap("100000.00", null)).toBe(100000)
  })
})

describe("exceedsPool", () => {
  it("is false exactly at the cap", () => {
    expect(exceedsPool(100000, 100000)).toBe(false)
  })
  it("absorbs sub-cent float rounding", () => {
    expect(exceedsPool(100000.0009, 100000)).toBe(false)
  })
  it("is true when meaningfully over the cap", () => {
    expect(exceedsPool(100000.02, 100000)).toBe(true)
  })
})
