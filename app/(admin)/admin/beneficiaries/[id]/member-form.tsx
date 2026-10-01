"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const RELATIONS = ["Self", "Spouse", "Child", "Parent", "Sibling", "Grandparent", "Other"]

export function MemberForm({ beneficiaryId }: { beneficiaryId: number }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [relation, setRelation] = useState(RELATIONS[0])
  const [age, setAge] = useState("")
  const [isEarner, setIsEarner] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/beneficiaries/${beneficiaryId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relation, age: parseInt(age), isEarner, isDisabled }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to add member")
      setLoading(false)
      return
    }

    setName("")
    setRelation(RELATIONS[0])
    setAge("")
    setIsEarner(false)
    setIsDisabled(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add Member</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mem-name" className="text-xs">Full Name</Label>
          <Input id="mem-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mem-relation" className="text-xs">Relation</Label>
          <select
            id="mem-relation"
            value={relation}
            onChange={e => setRelation(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mem-age" className="text-xs">Age</Label>
          <Input id="mem-age" type="number" min={0} max={120} value={age} onChange={e => setAge(e.target.value)} required placeholder="Age" />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isEarner} onChange={e => setIsEarner(e.target.checked)} className="rounded border-border" />
          Earner
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isDisabled} onChange={e => setIsDisabled(e.target.checked)} className="rounded border-border" />
          Disabled
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Adding..." : "Add Member"}
        </Button>
      </div>
    </form>
  )
}
