import { NextResponse } from "next/server"

// Shared route helpers so every handler validates and fails the same way.

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 })

export const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 })

// A serial primary key is a positive integer. Junk path segments (NaN, 0,
// negatives, floats) are bad requests, not lookups that miss.
export function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
