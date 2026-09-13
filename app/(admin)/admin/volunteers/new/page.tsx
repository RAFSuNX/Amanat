"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DISTRICTS = [
  "Dhaka","Chittagong","Rajshahi","Khulna","Barisal","Sylhet","Rangpur","Mymensingh",
  "Comilla","Cox's Bazar","Gazipur","Narayanganj","Tangail","Faridpur","Jessore",
  "Bogra","Dinajpur","Pabna","Sirajganj","Natore","Chapai Nawabganj","Naogaon",
  "Joypurhat","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon",
  "Gaibandha","Habiganj","Moulvibazar","Sunamganj","Netrokona","Kishoreganj",
  "Narsingdi","Manikganj","Munshiganj","Shariatpur","Madaripur","Gopalganj",
  "Rajbari","Feni","Noakhali","Lakshmipur","Chandpur","Brahmanbaria","Khagrachhari",
  "Rangamati","Bandarban","Patuakhali","Pirojpur","Jhalokhati","Borguna",
  "Bhola","Bagerhat","Satkhira","Narail","Magura","Jhenaidah","Kushtia",
  "Chuadanga","Meherpur","Sherpur","Jamalpur","Mymensingh","Netrokona",
].filter((v, i, a) => a.indexOf(v) === i).sort()

export default function NewVolunteerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    district: "",
    upazila: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/admin/volunteers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "Failed to create volunteer.")
      return
    }
    router.push("/admin/volunteers")
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Add Volunteer</h1>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Full Name *</Label>
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="As on NID or passport" />
          <p className="text-[10px] text-muted-foreground">Use the volunteer&apos;s name exactly as on their NID or passport for KYC matching.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email *</Label>
          <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Temporary Password *</Label>
          <Input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Volunteer will be asked to change this"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>District *</Label>
          <select
            required
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select district</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Upazila</Label>
          <Input value={form.upazila} onChange={(e) => set("upazila", e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Volunteer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
