import { z } from "zod"

// ── API contracts — single source of truth ────────────────────────────────────
// These define EXACTLY what the API accepts. Values are matched literally:
// "activate" is accepted, "ACTIVATE" is not. No case-folding, no aliases, no
// fallback. Both the route handlers and the tests import from here, so the
// contract cannot drift.

export const CYCLE_ACTIONS = [
  "calculate",
  "close-review",
  "override",
  "activate",
  "complete",
] as const

export type CycleAction = (typeof CYCLE_ACTIONS)[number]

export function isCycleAction(v: unknown): v is CycleAction {
  return typeof v === "string" && (CYCLE_ACTIONS as readonly string[]).includes(v)
}

export const createCycleSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
  totalPool: z.coerce.number().positive("Pool must be greater than zero"),
  specialDeductionTotal: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
})

export const overrideSchema = z.object({
  allotmentId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0, "Amount must be zero or more"),
})

// Volunteer requests a different amount than the algorithm calculated.
// A reason is mandatory; a receipt is optional.
export const volunteerRequestSchema = z.object({
  note: z.string().trim().min(3, "A reason is required."),
  requestedAmount: z.coerce.number().min(0).optional(),
  receiptUrl: z.string().url().optional(),
})
