"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function VerifyEmailClient({ invalid, email }: { invalid: boolean; email: string | null }) {
  const [addr, setAddr] = useState(email ?? "")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function resend() {
    if (!addr) { setError("Enter your email address."); return }
    setError("")
    setSent(false)
    setSending(true)
    const { error: sendError } = await authClient.sendVerificationEmail({
      email: addr,
      callbackURL: "/verify-email",
    })
    setSending(false)
    if (sendError) { setError(sendError.message ?? "Could not send. Please try again."); return }
    setSent(true)
  }

  return (
    <div className="w-full max-w-sm text-center flex flex-col gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
          invalid ? "bg-destructive/10 text-destructive" : "bg-muted"
        }`}
      >
        {invalid ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold">
          {invalid ? "Verification link invalid or expired" : "Check your email"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {invalid
            ? "This verification link is invalid or has expired. Enter your email below to get a new one."
            : "We sent a verification link to your email address. Click the link to activate your account."}
        </p>
        {!invalid && (
          <p className="text-xs text-muted-foreground mt-3">If you do not see it, check your spam folder.</p>
        )}
      </div>

      {sent ? (
        <p className="text-xs text-primary border border-primary/20 bg-primary/5 rounded px-3 py-2">
          A new verification email is on its way. Check your inbox.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={resend} disabled={sending} variant={invalid ? "default" : "outline"} className="w-full">
            {sending ? "Sending…" : "Resend verification email"}
          </Button>
        </div>
      )}

      <Link href="/login">
        <Button variant="ghost" className="w-full">Back to Sign in</Button>
      </Link>
    </div>
  )
}
