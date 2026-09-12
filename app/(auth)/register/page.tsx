"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [phone, setPhone] = useState("")
  const [district, setDistrict] = useState("")
  const [upazila, setUpazila] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (type === "volunteer" && !district) {
      setError("Please select your district.")
      return
    }

    setLoading(true)

    const { data, error: authError } = await signUp.email({
      email,
      password,
      name,
      // @ts-expect-error -- additional field
      phone: phone || undefined,
    })

    if (authError || !data) {
      setError(authError?.message ?? "Registration failed.")
      setLoading(false)
      return
    }

    if (type === "volunteer") {
      const res = await fetch("/api/volunteer/become", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, upazila, phone }),
      })
      if (!res.ok) {
        setError("Account created but volunteer setup failed. Contact support.")
        setLoading(false)
        return
      }
      router.push("/volunteer/kyc")
    } else {
      router.push("/account")
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="font-semibold text-lg">Amanat</Link>
        <p className="text-sm text-muted-foreground mt-1">Create an account</p>
      </div>

      {/* Type selector */}
      <div className="flex rounded-md border border-border overflow-hidden mb-6">
        {(["donor", "volunteer"] as AccountType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2.5 text-sm transition-colors ${
              type === t
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "donor" ? "I want to donate" : "I want to volunteer"}
          </button>
        ))}
      </div>

      {type === "volunteer" && (
        <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground mb-6 leading-relaxed">
          Volunteer accounts require KYC verification (NID, passport, or driving license) before access is granted. An admin will review and approve your application.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>

        {type === "volunteer" && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="district">District you will cover *</Label>
              <select
                id="district"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select district</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="upazila">Upazila (optional)</Label>
              <Input id="upazila" value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="e.g. Savar" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  )
}
