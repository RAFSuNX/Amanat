import { NextResponse } from "next/server"

// Shared route helpers so every handler validates and fails the same way.

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 })

export const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 })

export const notFound = (error = "Not found") =>
  NextResponse.json({ error }, { status: 404 })

// A serial primary key is a positive integer. Junk path segments (NaN, 0,
// negatives, floats) are bad requests, not lookups that miss.
export function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Parse a request body without letting a malformed/empty body throw a raw 500.
// Returns null on invalid JSON; callers validate (zod) or default from there.
export async function readJson(req: { json: () => Promise<unknown> }): Promise<unknown> {
  return req.json().catch(() => null)
}

// A postgres unique-violation (23505). Drizzle wraps the driver error, so the
// SQLSTATE lands on .cause, not the top level.
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | null
  return err?.code === "23505" || err?.cause?.code === "23505"
}
