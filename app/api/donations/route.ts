import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"

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
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const session = await getSession()
  const data = parsed.data

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

  await log({ userId: session?.user.id, userName: data.donorName, userRole: session?.user.role as string ?? "GUEST",
    action: "DONATION_SUBMITTED", resourceType: "donation",
    details: { amount: data.amount, method: data.method, isAnonymous: data.isAnonymous }, request })

  return NextResponse.json({ ok: true }, { status: 201 })
}
