"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

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

export function BecomeVolunteerButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [district, setDistrict] = useState("")
  const [upazila, setUpazila] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    setError("")
    if (!district) { setError("Please select your district."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/volunteer/become", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, upazila }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Something went wrong. Try again.")
        return
      }
      router.push("/volunteer/kyc")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full mt-1" onClick={() => setOpen(true)}>
        Become a volunteer
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold">District you will cover</label>
        <select value={district} onChange={(e) => setDistrict(e.target.value)}
          className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm">
          <option value="">Select district</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold">Upazila (optional)</label>
        <input value={upazila} onChange={(e) => setUpazila(e.target.value)}
          placeholder="e.g. Savar"
          className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading} className="flex-1">
          {loading ? "Submitting..." : "Apply as volunteer"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}
