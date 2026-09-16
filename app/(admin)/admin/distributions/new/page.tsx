"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewCyclePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    period: "",
    totalPool: "",
    specialDeductionTotal: "",
    notes: "",
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
    try {
      const res = await fetch("/api/admin/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d.error ?? "Failed to create cycle.")
        return
      }
      router.push(`/admin/distributions/${d.id}`)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-1">New Distribution Cycle</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Set the month and the total confirmed pool for this cycle. You will calculate the
        per-family split in the next step.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Month *</Label>
          <Input required type="month" value={form.period} onChange={(e) => set("period", e.target.value)} />
          <p className="text-[10px] text-muted-foreground">One cycle per month. Format YYYY-MM.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Total Pool (BDT) *</Label>
          <Input required type="number" min="1" step="0.01" value={form.totalPool}
            onChange={(e) => set("totalPool", e.target.value)} placeholder="e.g. 250000" />
          <p className="text-[10px] text-muted-foreground">Total confirmed funds available to distribute this month.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Special-Needs Reserve (BDT)</Label>
          <Input type="number" min="0" step="0.01" value={form.specialDeductionTotal}
            onChange={(e) => set("specialDeductionTotal", e.target.value)} placeholder="0" />
          <p className="text-[10px] text-muted-foreground">Amount held back from the regular split for special-need cases. Leave 0 if none.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Optional, shown on the public ledger" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Cycle"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
