"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PhoneForm({ current }: { current: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(current ?? "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function save() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Failed to save.")
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3 border-t border-border/40">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Mobile Number</p>
          <p className="text-sm">{current ?? "Not set"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          {current ? "Edit" : "Add"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 py-3 border-t border-border/40">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mobile Number</Label>
      <div className="flex gap-2">
        <Input
          type="tel"
          placeholder="01XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoFocus
        />
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setPhone(current ?? "") }}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
