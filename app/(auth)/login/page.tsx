"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setNeedsVerify(false)
    setResent(false)
    setLoading(true)
    const { data, error: authError } = await signIn.email({ email, password })
    setLoading(false)
    if (authError || !data) {
      // Distinguish "email not verified" from bad credentials - otherwise the
      // user thinks their (correct) password is wrong and keeps retrying.
      const code = (authError as { code?: string } | null)?.code
      if (code === "EMAIL_NOT_VERIFIED" || /verif/i.test(authError?.message ?? "")) {
        setNeedsVerify(true)
        setError("Your email isn't verified yet. Check your inbox for the verification link.")
      } else {
        setError("Invalid email or password.")
      }
      return
    }
    const role = (data.user as { role?: string }).role
    if (role === "ADMIN") router.push("/admin")
    else if (role === "VOLUNTEER") router.push("/volunteer")
    else router.push("/account")
  }

  async function resendVerification() {
    if (!email) { setError("Enter your email above first."); return }
    setResent(false)
    await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email" })
    setResent(true)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">Email</label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">Password</label>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && (
          <div className="text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded flex flex-col gap-2">
            <p className="text-destructive">{error}</p>
            {needsVerify && (
              resent ? (
                <p className="text-muted-foreground">Verification email sent. Check your inbox (and spam).</p>
              ) : (
                <button
                  type="button"
                  onClick={resendVerification}
                  className="self-start text-primary underline underline-offset-2"
                >
                  Resend verification email
                </button>
              )
            )}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground border-t border-border/40 pt-6">
        No account?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-2">Create one</Link>
        {" "}to track your donations.
      </p>
    </div>
  )
}
