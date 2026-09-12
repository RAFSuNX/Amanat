"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { data, error: authError } = await signIn.email({ email, password })
    setLoading(false)
    if (authError || !data) { setError("Invalid email or password."); return }
    const role = (data.user as { role?: string }).role
    if (role === "ADMIN") router.push("/admin")
    else if (role === "VOLUNTEER") router.push("/volunteer")
    else router.push("/account")
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
          <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">
            {error}
          </p>
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
