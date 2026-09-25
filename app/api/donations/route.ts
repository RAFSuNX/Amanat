import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"
import { rateLimitOk } from "@/lib/redis"
import { isUniqueViolation, readJson } from "@/lib/http"

async function sendDonationConfirmation(email: string, name: string, amount: number, method: string, ref: string, receipt: string, donationId: number) {
  if (!process.env.RESEND_API_KEY) return
  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  const APP_URL = process.env.BETTER_AUTH_URL || "https://theamanat.org"
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@theamanat.org"
  const LOGO_URL = `${APP_URL}/logo-white.png`
  const LEDGER_URL = `${APP_URL}/ledger/donations`
  const INVOICE_URL = `${APP_URL}/ledger/donations/${donationId}/invoice`
  const amountFmt = amount.toLocaleString("en-BD")

  await resend.emails.send({
    from: `Amanat | The Hope for All of Us <${process.env.RESEND_FROM_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
    to: email,
    subject: "Thank you for your donation - Amanat",
    text:
      `Thank you for your donation, ${name}\n\n` +
      `We have received your donation of ${amountFmt} BDT via ${method}.\n` +
      `Transaction reference: ${ref}\n` +
      `Your Amanat receipt number: ${receipt}\n\n` +
      `Your donation is currently pending review. It will appear on the public ledger within approximately one hour.\n` +
      `Our team will verify it within 24 hours, after which it will be added to the donation pool.\n\n` +
      `We urge you to keep an eye on the public ledger until your donation is verified and confirmed.\n` +
      `This is how you can be sure your donation reached us properly and is accounted for.\n` +
      `If it does not appear within one hour or is not verified within 24 hours, please contact us immediately.\n\n` +
      `View the public ledger: ${LEDGER_URL}\n` +
      `Your invoice (available once verified): ${INVOICE_URL}\n\n` +
      `Need help? Contact ${SUPPORT_EMAIL}\n\n` +
      `Amanat. The Hope for All of Us`,
    html: `
      <div style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2f6b45">
          <tr><td style="padding:28px 32px">
            <img src="${LOGO_URL}" alt="Amanat" height="44" style="height:44px;width:auto;display:inline-block;border:0;vertical-align:middle" />
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
          <tr><td style="padding:40px 32px">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px">Thank you, ${name}</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#52525b">
              We have received your donation of <strong>${amountFmt} BDT</strong> via ${method}.
            </p>
            <div style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:10px;padding:24px 28px;margin:0 0 28px">
              <p style="margin:0;font-size:32px;font-weight:700;color:#2f6b45;letter-spacing:-1px">${amountFmt} BDT</p>
              <p style="margin:10px 0 0;font-size:13px;color:#52525b">${method} &middot; Ref: <span style="font-family:monospace">${ref}</span></p>
              <p style="margin:6px 0 0;font-size:12px;color:#71717a">Receipt: <strong style="font-family:monospace;color:#2f6b45">${receipt}</strong></p>
            </div>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#52525b">
              Your donation is <strong>pending review</strong> and will appear on the public ledger within approximately <strong>one hour</strong>.
              Our team will verify it within <strong>24 hours</strong>, after which it will be added to the donation pool.
            </p>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#52525b">
              We urge you to <strong>keep an eye on the public ledger</strong> until your donation is verified and confirmed.
              This is how you can be sure your donation reached us properly and is accounted for.
              If it does not appear within one hour or is not verified within 24 hours, please reach out to us immediately.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr><td style="border-radius:8px;background:#2f6b45">
                <a href="${LEDGER_URL}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">View Public Ledger</a>
              </td></tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#71717a">
              Once verified, your invoice will be at:<br/>
              <a href="${INVOICE_URL}" style="color:#2f6b45;word-break:break-all">${INVOICE_URL}</a>
            </p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-top:1px solid #e4e4e7">
          <tr><td style="padding:24px 32px 28px">
            <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a">
              You received this email because you submitted a donation to Amanat with this email address.
            </p>
            <p style="margin:0;font-size:12px;color:#71717a">
              Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#2f6b45;font-weight:600">${SUPPORT_EMAIL}</a>
            </p>
            <p style="margin:16px 0 0;font-size:11px;color:#a1a1aa">Amanat. A structured, accountable, and transparent welfare system.</p>
          </td></tr>
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

  let donationId: number
  let donationDate: Date
  try {
    const [row] = await db.insert(donations).values({
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
    }).returning({ id: donations.id, createdAt: donations.createdAt })
    donationId = row.id
    donationDate = row.createdAt
  } catch (e) {
    if (isUniqueViolation(e))
      return NextResponse.json(
        { error: "This transaction has already been submitted." },
        { status: 409 }
      )
    throw e
  }

  const d = donationDate.toISOString().slice(0, 10).replace(/-/g, "")
  const receipt = `AMT-${d}-${String(donationId).padStart(5, "0")}`

  await log({ userId: session?.user.id, userName: data.donorName, userRole: session?.user.role as string ?? "GUEST",
    action: "DONATION_SUBMITTED", resourceType: "donation",
    details: { amount: data.amount, method: data.method, isAnonymous: data.isAnonymous }, request })

  // Fire-and-forget: email failure must never block or fail the donation response.
  if (data.donorEmail)
    sendDonationConfirmation(data.donorEmail, data.donorName, data.amount, data.method, data.transactionRef, receipt, donationId).catch(() => {})

  return NextResponse.json({ ok: true, receipt, donationId }, { status: 201 })
}
