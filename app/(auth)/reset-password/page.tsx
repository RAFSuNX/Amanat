"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token")
  const error = params.get("error")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(
    error ? "This reset link is invalid or has expired. Please request a new one." : ""
  )
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setFormError("Passwords do not match."); return }
    if (password.length < 8) { setFormError("Password must be at least 8 characters."); return }
    if (!token) { setFormError("Missing reset token. Please request a new link."); return }
    setFormError("")
    setLoading(true)
    const { error: err } = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)
    if (err) { setFormError(err.message ?? "Something went wrong. Please request a new link."); return }
    setDone(true)
    setTimeout(() => router.push("/login"), 3000)
  }

  if (!token && !error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
          <p className="text-sm text-muted-foreground mt-1">No reset token found. Please request a new password reset link.</p>
        </div>
        <Link href="/forgot-password"><Button className="w-full">Request new link</Button></Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
          <p className="text-sm text-muted-foreground mt-1">Your password has been reset. Redirecting you to sign in...</p>
        </div>
        <Link href="/login"><Button className="w-full">Sign in</Button></Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Password reset</p>
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">New password</label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">Confirm new password</label>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {formError && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">{formError}</p>}
        {(error || formError.includes("invalid") || formError.includes("expired")) && (
          <Link href="/forgot-password" className="text-xs text-primary underline underline-offset-2 self-start">
            Request a new reset link
          </Link>
        )}
        <Button type="submit" disabled={loading || !!error} className="w-full mt-1">
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  )
}
