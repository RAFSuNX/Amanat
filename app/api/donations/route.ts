import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"
import { rateLimitOk } from "@/lib/redis"
import { isUniqueViolation, readJson } from "@/lib/http"

async function sendDonationConfirmation(email: string, name: string, amount: number, method: string, ref: string) {
  if (!process.env.RESEND_API_KEY) return
  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  const APP_URL = process.env.BETTER_AUTH_URL || "https://amanat.org"
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@amanat.org"
  const LOGO_URL = `${APP_URL}/logo-white.png`
  const LEDGER_URL = `${APP_URL}/ledger/donations`
  const amountFmt = amount.toLocaleString("en-BD")

  await resend.emails.send({
    from: `Amanat | The Hope for All of Us <${process.env.RESEND_FROM_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
    to: email,
    subject: "Thank you for your donation - Amanat",
    text:
      `Thank you for your donation, ${name}\n\n` +
      `We have received your donation of ${amountFmt} BDT via ${method}.\n` +
      `Transaction reference: ${ref}\n\n` +
      `Your donation is currently pending review. It will appear on the public ledger within approximately one hour.\n\n` +
      `Our team will verify your donation within 24 hours. You can check the status at any time:\n${LEDGER_URL}\n\n` +
      `Need help? Contact ${SUPPORT_EMAIL}\n\n` +
      `Amanat. The Hope for All of Us`,
    html: `
      <div style="padding:16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:30px 32px;background:#2f6b45;text-align:center">
              <img src="${LOGO_URL}" alt="Amanat" height="60" style="height:60px;width:auto;display:inline-block;border:0" />
              <p style="margin:14px 0 0;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:700">The Hope for All of Us</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 12px;font-size:20px;color:#18181b">Thank you, ${name}</h1>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#52525b">
                We have received your donation. Here is a summary:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
                <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e4e4e7">
                  <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#71717a;font-weight:600">Amount</span>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2f6b45">${amountFmt} BDT</p>
                </td></tr>
                <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e4e4e7">
                  <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#71717a;font-weight:600">Method</span>
                  <p style="margin:4px 0 0;font-size:14px;color:#18181b">${method}</p>
                </td></tr>
                <tr><td style="padding:12px 16px;background:#f9fafb">
                  <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#71717a;font-weight:600">Transaction Reference</span>
                  <p style="margin:4px 0 0;font-size:13px;font-family:monospace;color:#18181b">${ref}</p>
                </td></tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#52525b">
                Your donation is <strong>pending review</strong> and will appear on the public ledger within approximately <strong>one hour</strong>.
                Our team will verify it within <strong>24 hours</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b">
                You can check the ledger at any time to see your donation's status.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="border-radius:6px;background:#2f6b45">
                  <a href="${LEDGER_URL}" style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px">View Public Ledger</a>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;border-top:1px solid #eeeeee;background:#f9fafb">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a">
                You received this email because you submitted a donation to Amanat with this email address.
              </p>
              <p style="margin:0;font-size:12px;color:#71717a">
                Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#2f6b45;font-weight:600">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:14px 0 0;font-size:11px;color:#a1a1aa">Amanat. A structured, accountable, and transparent welfare system.</p>
            </td>
          </tr>
        </table>
      </div>
    `,
  })
}

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

  // Fire-and-forget: email failure must never block or fail the donation response.
  if (data.donorEmail)
    sendDonationConfirmation(data.donorEmail, data.donorName, data.amount, data.method, data.transactionRef).catch(() => {})

  return NextResponse.json({ ok: true }, { status: 201 })
}
