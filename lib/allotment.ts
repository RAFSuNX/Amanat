// Pure money helpers for distribution allotments. No DB, no I/O - so they are
// unit-testable and used identically by the API and the admin UI.

export type AllotmentAmounts = {
  allocatedAmount: string | null
  manualOverrideAmount: string | null
}

// The authoritative amount for an allotment: an admin override wins over the
// calculated allocation. That is the ONLY precedence - nothing else is inferred.
export function finalAmount(a: AllotmentAmounts): number {
  const v = a.manualOverrideAmount ?? a.allocatedAmount
  return v == null ? 0 : parseFloat(v)
}

export function sumFinal(rows: AllotmentAmounts[]): number {
  return rows.reduce((s, r) => s + finalAmount(r), 0)
}

// Pool available for regular allotments = total pool minus the special-needs reserve.
export function poolCap(totalPool: string, specialDeductionTotal: string | null): number {
  return parseFloat(totalPool) - parseFloat(specialDeductionTotal ?? "0")
}

// Over the pool, with a tiny epsilon to absorb 2-decimal float rounding.
export function exceedsPool(totalFinal: number, cap: number): boolean {
  return totalFinal > cap + 0.001
}
