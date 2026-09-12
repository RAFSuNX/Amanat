import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/schema"

const hasResend = Boolean(process.env.RESEND_API_KEY)

async function sendVerificationEmail(user: { email: string }, url: string) {
  if (!hasResend) return
  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: "Amanat <noreply@amanat.org>",
    to: user.email,
    subject: "Verify your email - Amanat",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <p style="font-size:18px;font-weight:600;margin:0 0 8px">Verify your email</p>
        <p style="color:#666;margin:0 0 24px">Click the link below to verify your email address and activate your Amanat account.</p>
        <a href="${url}" style="display:inline-block;background:#2f6b45;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px">Verify Email</a>
        <p style="color:#999;font-size:12px;margin-top:24px">If you did not create an account, you can safely ignore this email.</p>
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
