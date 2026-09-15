"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function NewApplicationPage() {
  const router = useRouter()
  const [beneficiaries, setBeneficiaries] = useState<{ id: number; name: string }[]>([])
  const [beneficiaryId, setBeneficiaryId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/volunteer/my-beneficiaries")
      .then(r => r.json())
      .then(data => setBeneficiaries(data ?? []))
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!beneficiaryId || !title || !description || !amount) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    const res = await fetch("/api/volunteer/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId: Number(beneficiaryId), title, description, amountRequested: Number(amount) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed."); return }
    router.push("/volunteer/applications")
  }

  const labelClass = "text-xs font-semibold text-foreground"
  const fieldClass = "flex flex-col gap-2"

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Special Need Application</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit for a family with an urgent need outside the regular distribution cycle.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className={fieldClass}>
          <Label className={labelClass}>Beneficiary</Label>
          <select value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)}
            className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Select beneficiary</option>
            {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Medical emergency, surgery needed" required />
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Describe the emergency, why it cannot wait for the regular cycle, and how the funds will be used." required />
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Amount Requested (BDT)</Label>
          <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 15000" required />
        </div>

        {error && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
