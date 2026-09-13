import { describe, it, expect } from "vitest"
import { calcWeightedScore } from "@/lib/distribution"

const m = (age: number, isEarner = false, isDisabled = false) => ({ age, isEarner, isDisabled })

describe("calcWeightedScore", () => {
  it("applies the family-size factor with no bonuses", () => {
    // one earning adult: familyFactor = 1 + 1*0.1 = 1.1, no other bonuses
    expect(calcWeightedScore(1000, [m(30, true)])).toBeCloseTo(1100, 5)
  })

  it("adds child, and no-earner bonuses", () => {
    // family of 4: 2 adults (none earning), 2 children under 12, need 1000
    // familyFactor 1.4 + children 2*0.15=0.30 + noEarner 0.2 = 1.9  -> 1900
    const score = calcWeightedScore(1000, [m(35), m(33), m(8), m(4)])
    expect(score).toBeCloseTo(1900, 5)
  })

  it("adds elderly and disability bonuses", () => {
    // 1 elderly disabled member, earning: familyFactor 1.1 + elderly 0.1 + disabled 0.3 = 1.5
    expect(calcWeightedScore(1000, [m(70, true, true)])).toBeCloseTo(1500, 5)
  })

  it("gives a no-earner household a strictly higher score than an identical earning one", () => {
    const earning = calcWeightedScore(1000, [m(40, true), m(38, true)])
    const noEarner = calcWeightedScore(1000, [m(40, false), m(38, false)])
    expect(noEarner).toBeGreaterThan(earning)
  })

  it("is linear in declared need", () => {
    const family = [m(40), m(38), m(10)]
    expect(calcWeightedScore(2000, family)).toBeCloseTo(2 * calcWeightedScore(1000, family), 5)
  })

  it("never divides by zero with an empty member list", () => {
    expect(Number.isFinite(calcWeightedScore(1000, []))).toBe(true)
  })
})
