"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DISTRICTS = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria",
  "Chandpur","Chapai Nawabganj","Chattogram","Chuadanga","Cox's Bazar","Cumilla",
  "Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj",
  "Habiganj","Jamalpur","Jashore","Jhalokati","Jhenaidah","Joypurhat",
  "Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur",
  "Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar",
  "Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi",
  "Natore","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali",
  "Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur",
  "Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon",
].sort()

type AccountType = "donor" | "volunteer"

export default function RegisterPage() {
  const router = useRouter()
  const [type, setType] = useState<AccountType>("donor")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [district, setDistrict] = useState("")
  const [upazila, setUpazila] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (type === "volunteer" && !district) { setError("Select your district."); return }
    setLoading(true)

    if (type === "volunteer") {
      // One server call creates the account AND the volunteer profile. Email
      // verification means there is no session immediately after sign-up, so the
      // old client-side signUp + authenticated /become call always failed here.
      const res = await fetch("/api/volunteer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, district, upazila }),
      })
      const d = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) { setError(d.error ?? "Registration failed."); return }
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      return
    }

    const { data, error: authError } = await signUp.email({ email, password, name })
    setLoading(false)
    if (authError || !data) {
      setError(authError?.message ?? "Registration failed.")
      return
    }
    router.push("/verify-email")
  }

  const fieldClass = "flex flex-col gap-2"
  const labelClass = "text-xs font-semibold text-foreground"
  const selectClass = "flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Join Amanat</p>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
      </div>

      {/* Type toggle */}
      <div className="flex border border-border rounded overflow-hidden">
        {(["donor", "volunteer"] as AccountType[]).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex-1 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors ${
              type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t === "donor" ? "I want to donate" : "I want to volunteer"}
          </button>
        ))}
      </div>

      {type === "volunteer" && (
        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 leading-relaxed">
          Volunteer accounts require KYC verification before access is granted. An admin will review your application.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className={fieldClass}>
          <label className={labelClass}>Full Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="As on your NID or passport" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Please use your name exactly as it appears on your NID or passport. This helps us verify your identity if needed.
          </p>
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Email</label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Password</label>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>

        {type === "volunteer" && (
          <>
            <div className={fieldClass}>
              <label className={labelClass}>District you will cover</label>
              <select required value={district} onChange={(e) => setDistrict(e.target.value)} className={selectClass}>
                <option value="">Select district</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Upazila (optional)</label>
              <Input value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="e.g. Savar" />
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground border-t border-border/40 pt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-2">Sign in</Link>
      </p>
    </div>
  )
}
