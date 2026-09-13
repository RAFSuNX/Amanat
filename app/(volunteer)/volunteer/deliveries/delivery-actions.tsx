"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function DeliveryActions({
  allotmentId,
  deliveryStatus,
  cycleStatus,
  isFlagged,
  flagNote,
  requestedAmount,
}: {
  allotmentId: number
  deliveryStatus: string
  cycleStatus: string
  isFlagged: boolean
  flagNote: string
  requestedAmount: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState(requestedAmount)
  const [note, setNote] = useState(flagNote)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")

  async function deliver() {
    setLoading("deliver")
    const res = await fetch(`/api/volunteer/deliveries/${allotmentId}/deliver`, { method: "POST" })
    setLoading(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Failed.")
      return
    }
    router.refresh()
  }

  async function submitRequest() {
    setError("")
    if (note.trim().length < 3) {
      setError("Please give a reason.")
      return
    }
    setLoading("request")

    let receiptUrl: string | undefined
    if (file) {
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/upload/receipt", { method: "POST", body: fd })
      if (!up.ok) {
        const d = await up.json().catch(() => ({}))
        setLoading(null)
        setError(d.error ?? "Receipt upload failed.")
        return
      }
      receiptUrl = (await up.json()).url
    }

    const res = await fetch(`/api/volunteer/deliveries/${allotmentId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        requestedAmount: amount === "" ? undefined : Number(amount),
        receiptUrl,
      }),
    })
    setLoading(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Request failed.")
      return
    }
    setShowForm(false)
    router.refresh()
  }

  if (deliveryStatus === "DELIVERED") {
    return <span className="text-xs text-muted-foreground">Delivered</span>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {cycleStatus === "ACTIVE" && (
          <Button size="sm" disabled={loading !== null} onClick={deliver}>
            {loading === "deliver" ? "…" : "Mark Delivered"}
          </Button>
        )}
        {cycleStatus === "VOLUNTEER_REVIEW" && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            {isFlagged ? "Edit Request" : "Request Adjustment"}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="flex flex-col gap-2 border rounded p-3 bg-muted/30 w-72">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Requested amount (BDT)</Label>
            <Input type="number" min="0" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Reason *</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Why this family needs a different amount this month"
              className="text-sm min-h-16" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Receipt (optional)</Label>
            <input type="file" accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" disabled={loading !== null} onClick={submitRequest}>
            {loading === "request" ? "…" : "Submit Request"}
          </Button>
        </div>
      )}
      {!showForm && error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
