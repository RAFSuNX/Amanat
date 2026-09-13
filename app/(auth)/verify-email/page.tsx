import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { VerifyEmailClient } from "./verify-email-client"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>
}) {
  const sp = await searchParams
  const invalid = !!sp.error // Better Auth appends ?error=INVALID_TOKEN on a bad/expired link

  // A successful verification auto-signs the user in and redirects back here —
  // send them on to their area instead of showing "check your email".
  if (!invalid) {
    const session = await getSession()
    if (session) {
      const role = (session.user as { role?: string }).role
      redirect(role === "ADMIN" ? "/admin" : role === "VOLUNTEER" ? "/volunteer" : "/account")
    }
  }

  return <VerifyEmailClient invalid={invalid} email={sp.email ?? null} />
}
