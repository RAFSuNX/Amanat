import { describe, it, expect } from "vitest"
import { parseId } from "@/lib/http"

// parseId guards every /[id]/ admin route. A serial PK is a positive integer;
// anything else must be rejected before it reaches the database.
describe("parseId", () => {
  it("accepts a positive integer string", () => {
    expect(parseId("1")).toBe(1)
    expect(parseId("42")).toBe(42)
  })
  it("rejects junk, zero, negatives and floats", () => {
    for (const bad of ["abc", "", "0", "-3", "1.5", "NaN", " ", "3x"])
      expect(parseId(bad)).toBeNull()
  })
})
