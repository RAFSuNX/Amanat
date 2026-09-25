"use client"

import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })
    setLoading(false)
    if (err) { setError(err.message ?? "Something went wrong. Please try again."); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your inbox and spam folder.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">Back to Sign in</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Password reset</p>
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">Email</label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground border-t border-border/40 pt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-2">Sign in</Link>
      </p>
    </div>
  )
}
