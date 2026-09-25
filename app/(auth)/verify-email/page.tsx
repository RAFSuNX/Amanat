import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { VerifyEmailClient } from "./verify-email-client"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; verified?: string }>
}) {
  const sp = await searchParams
  const invalid = !!sp.error
  const justVerified = sp.verified === "1"

  if (!invalid) {
    const session = await getSession()
    if (session) {
      const role = (session.user as { role?: string }).role
      const destination = role === "ADMIN" ? "/admin" : role === "VOLUNTEER" ? "/volunteer" : "/account"
      // Show the verified confirmation screen instead of silently redirecting.
      if (justVerified) return <VerifyEmailClient invalid={false} email={null} verified destination={destination} />
      redirect(destination)
    }
  }

  return <VerifyEmailClient invalid={invalid} email={sp.email ?? null} />
}
