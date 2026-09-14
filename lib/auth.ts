import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/schema"

const hasResend = Boolean(process.env.RESEND_API_KEY)

async function sendVerificationEmail(user: { email: string }, url: string) {
  if (!hasResend) return
  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)

  const APP_URL = process.env.BETTER_AUTH_URL || "https://amanat.rafsunx.com"
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@amanat.org"
  // White logo sits on the green header band, so it reads correctly in both
  // light and dark mode (email clients don't reliably support CSS filters or
  // prefers-color-scheme logo swaps, so we avoid needing them).
  const LOGO_URL = `${APP_URL}/logo-white.png`

  await resend.emails.send({
    // RESEND_FROM_EMAIL is a raw address; the "Amanat" display name is added here.
    from: `Amanat | The Hope for All of Us <${process.env.RESEND_FROM_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
    to: user.email,
    subject: "Verify your email - Amanat",
    text:
      `Verify your email address\n\n` +
      `Welcome to Amanat. Confirm your email to activate your account:\n${url}\n\n` +
      `This link expires in 1 hour.\n\n` +
      `You received this email because an Amanat account was created with this address. ` +
      `If this wasn't you, you can safely ignore it.\n\n` +
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
              <h1 style="margin:0 0 12px;font-size:20px;color:#18181b">Verify your email address</h1>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#52525b">
                Welcome to Amanat. Please confirm this is your email address to activate your account and keep it secure.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="border-radius:6px;background:#2f6b45">
                  <a href="${url}" style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px">Verify Email Address</a>
                </td></tr>
              </table>
              <p style="margin:22px 0 6px;font-size:12px;color:#71717a">This link expires in 1 hour.</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:6px 0 0;font-size:12px;word-break:break-all"><a href="${url}" style="color:#2f6b45">${url}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;border-top:1px solid #eeeeee;background:#f9fafb">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a">
                You received this email because an Amanat account was created with this address. If this wasn't you, you can safely ignore it and no account will be activated.
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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: hasResend,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user, url)
    },
    autoSignInAfterVerification: true,
  },
  // Only our own origin is a valid redirect/callback target - blocks open-redirect
  // phishing through the verification link's callbackURL.
  trustedOrigins: [process.env.BETTER_AUTH_URL || "https://amanat.rafsunx.com"],
  // Throttle abuse: email-bombing a victim, enumeration, and burning Resend quota
  // by hammering the verification-email / sign-up endpoints.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/send-verification-email": { window: 60, max: 3 },
      "/sign-up/email": { window: 300, max: 5 },
      "/sign-in/email": { window: 60, max: 10 },
      "/forget-password": { window: 300, max: 3 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "DONOR",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
