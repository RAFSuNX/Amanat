"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const DIVISIONS = ["Dhaka","Chittagong","Rajshahi","Khulna","Barisal","Sylhet","Rangpur","Mymensingh"]

const DISTRICTS: Record<string, string[]> = {
  Dhaka: ["Dhaka","Gazipur","Narayanganj","Narsingdi","Munshiganj","Manikganj","Rajbari","Faridpur","Madaripur","Shariatpur","Gopalganj","Kishoreganj","Tangail"],
  Chittagong: ["Chittagong","Cox's Bazar","Feni","Lakshmipur","Noakhali","Chandpur","Comilla","Brahmanbaria","Khagrachhari","Rangamati","Bandarban"],
  Rajshahi: ["Rajshahi","Bogura","Pabna","Sirajganj","Natore","Chapai Nawabganj","Naogaon","Joypurhat"],
  Khulna: ["Khulna","Bagerhat","Satkhira","Jessore","Narail","Magura","Jhenaidah","Kushtia","Chuadanga","Meherpur"],
  Barisal: ["Barisal","Patuakhali","Pirojpur","Jhalokati","Borguna","Bhola"],
  Sylhet: ["Sylhet","Habiganj","Moulvibazar","Sunamganj"],
  Rangpur: ["Rangpur","Dinajpur","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon","Gaibandha"],
  Mymensingh: ["Mymensingh","Netrokona","Kishoreganj","Sherpur","Jamalpur"],
}

const RELATIONS = ["Self","Spouse","Son","Daughter","Father","Mother","Brother","Sister","Grandfather","Grandmother","Other"]
const STEPS = ["Person","Address","Household","Need","Review"]

type Member = { name: string; relation: string; age: string; isDisabled: boolean; isEarner: boolean }

const blankMember = (): Member => ({ name: "", relation: "Self", age: "", isDisabled: false, isEarner: false })

export default function NewBeneficiaryPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)

  // Step 1: Person
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [nidNumber, setNidNumber] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [type, setType] = useState<"INDIVIDUAL" | "FAMILY">("INDIVIDUAL")

  // Step 2: Address
  const [division, setDivision] = useState("")
  const [district, setDistrict] = useState("")
  const [upazila, setUpazila] = useState("")
  const [union, setUnion] = useState("")
  const [village, setVillage] = useState("")

  // Step 3: Household
  const [members, setMembers] = useState<Member[]>([blankMember()])

  // Step 4: Need
  const [monthlyNeed, setMonthlyNeed] = useState("")
  const [notes, setNotes] = useState("")

  async function uploadPhoto(file: File) {
    setPhotoUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/beneficiary", { method: "POST", body: fd })
      if (!res.ok) { setError("Photo upload failed."); return }
      const { url } = await res.json()
      setPhotoUrl(url)
    } catch {
      setError("Photo upload failed (network).")
    } finally {
      setPhotoUploading(false)
    }
  }

  function addMember() { setMembers((m) => [...m, blankMember()]) }
  function removeMember(i: number) { setMembers((m) => m.filter((_, idx) => idx !== i)) }
  function updateMember(i: number, field: keyof Member, val: string | boolean) {
    setMembers((m) => m.map((mb, idx) => idx === i ? { ...mb, [field]: val } : mb))
  }

  function validateStep() {
    if (step === 0 && !name) return "Name is required."
    if (step === 1 && (!division || !district)) return "Division and district are required."
    if (step === 2 && members.some((m) => !m.name || !m.age)) return "All members need a name and age."
    if (step === 3 && !monthlyNeed) return "Monthly need amount is required."
    return ""
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError("")
    setStep((s) => s + 1)
  }

  async function submit() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/volunteer/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone: phone || undefined, nidNumber: nidNumber || undefined,
          photoUrl: photoUrl || undefined, type, division, district,
          upazila: upazila || undefined, union: union || undefined, village: village || undefined,
          members: members.map((m) => ({ ...m, age: Number(m.age) })),
          declaredMonthlyNeed: Number(monthlyNeed),
          assessmentNotes: notes || undefined,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed."); return }
      router.push("/volunteer/beneficiaries")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = STEPS

  return (
    <div className="max-w-xl flex flex-col gap-6">
      {/* Progress */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Register Beneficiary</h1>
        <div className="flex gap-1">
          {stepLabels.map((l, i) => (
            <div key={l} className="flex items-center gap-1 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-xs shrink-0 ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded">{error}</p>}

      {/* ── Step 0: Person ── */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            {(["INDIVIDUAL", "FAMILY"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 text-sm rounded border transition-colors ${type === t ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"}`}>
                {t === "INDIVIDUAL" ? "Individual" : "Family"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="As on NID or passport" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Please record the name exactly as it appears on their NID or passport. This is important for identity verification and future authentication.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Phone Number</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>NID / Birth Registration Number</Label>
            <Input value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="If available" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Photo *</Label>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
            {photoUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            {photoUrl && (
              <img src={photoUrl} alt="Beneficiary" className="w-24 h-24 object-cover rounded border" />
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Address ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Division *</Label>
            <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict("") }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select division</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>District *</Label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!division}>
              <option value="">Select district</option>
              {(DISTRICTS[division] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Upazila / Thana</Label>
            <Input value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="e.g. Savar" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Union / Ward</Label>
            <Input value={union} onChange={(e) => setUnion(e.target.value)} placeholder="e.g. Aminbazar Union" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Village / Mahalla / Road</Label>
            <Input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Specific location" />
          </div>
        </div>
      )}

      {/* ── Step 2: Household ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Add all household members including the main person. Mark who earns and who has a disability.
          </p>
          {members.map((m, i) => (
            <div key={i} className="border rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member {i + 1}</span>
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Name *</Label>
                  <Input value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} placeholder="Full name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Relation *</Label>
                  <select value={m.relation} onChange={(e) => updateMember(i, "relation", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Age *</Label>
                  <Input type="number" min="0" max="120" value={m.age} onChange={(e) => updateMember(i, "age", e.target.value)} placeholder="Years" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={m.isDisabled} onChange={(e) => updateMember(i, "isDisabled", e.target.checked)} />
                  Has disability
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={m.isEarner} onChange={(e) => updateMember(i, "isEarner", e.target.checked)} />
                  Has income / earner
                </label>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addMember}>+ Add Member</Button>
        </div>
      )}

      {/* ── Step 3: Need ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Estimated Monthly Need (BDT) *</Label>
            <Input type="number" min="0" value={monthlyNeed} onChange={(e) => setMonthlyNeed(e.target.value)}
              placeholder="e.g. 5000" />
            <p className="text-xs text-muted-foreground">Include food, medicine, utilities, and essential costs.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Situation Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              placeholder="Describe the family's situation, why they need support, any special circumstances..." />
          </div>
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === 4 && (
        <div className="flex flex-col gap-4 text-sm">
          <h2 className="font-semibold">Review before submitting</h2>
          {[
            ["Name", name],
            ["Type", type],
            ["Phone", phone || "Not provided"],
            ["NID", nidNumber || "Not provided"],
            ["Address", [village, union, upazila, district, division].filter(Boolean).join(", ")],
            ["Household members", `${members.length} person(s)`],
            ["Earners", `${members.filter((m) => m.isEarner).length}`],
            ["Disabled members", `${members.filter((m) => m.isDisabled).length}`],
            ["Monthly need", `BDT ${Number(monthlyNeed).toLocaleString()}`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-medium text-right max-w-xs">{v}</span>
            </div>
          ))}
          {photoUrl && <img src={photoUrl} alt="Photo" className="w-20 h-20 rounded border object-cover" />}
          <p className="text-xs text-muted-foreground mt-2">
            Once submitted, an admin will review and approve this registration before it becomes active.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => { setError(""); setStep((s) => s - 1) }}>
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button type="button" onClick={next} className="flex-1">Continue</Button>
        ) : (
          <Button type="button" onClick={submit} disabled={loading} className="flex-1">
            {loading ? "Submitting..." : "Submit for Review"}
          </Button>
        )}
      </div>
    </div>
  )
}
