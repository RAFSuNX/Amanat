import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"
import { rateLimitOk } from "@/lib/redis"
import { isUniqueViolation, readJson } from "@/lib/http"

const schema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["BKASH", "NAGAD", "BANK", "OTHER"]),
  transactionRef: z.string().min(3),
  donorName: z.string().min(1),
  donorPhone: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
  receiptImageUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  // Public unauthenticated write - throttle per IP so it can't be flooded.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ?? "unknown"
  if (!(await rateLimitOk(`donate:${ip}`, 10, 60)))
    return NextResponse.json({ error: "Too many submissions. Please wait a minute." }, { status: 429 })

  const body = await readJson(request)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const session = await getSession()
  const data = parsed.data

  try {
    await db.insert(donations).values({
      userId: session?.user.id ?? null,
      donorName: data.donorName,
      donorPhone: data.donorPhone ?? null,
      donorEmail: data.donorEmail || null,
      amount: data.amount.toFixed(2),
      method: data.method,
      transactionRef: data.transactionRef,
      isAnonymous: data.isAnonymous,
      receiptImageUrl: data.receiptImageUrl ?? null,
      status: "PENDING",
    })
  } catch (e) {
    if (isUniqueViolation(e))
      return NextResponse.json(
        { error: "This transaction has already been submitted." },
        { status: 409 }
      )
    throw e
  }

  await log({ userId: session?.user.id, userName: data.donorName, userRole: session?.user.role as string ?? "GUEST",
    action: "DONATION_SUBMITTED", resourceType: "donation",
    details: { amount: data.amount, method: data.method, isAnonymous: data.isAnonymous }, request })

  return NextResponse.json({ ok: true }, { status: 201 })
}
