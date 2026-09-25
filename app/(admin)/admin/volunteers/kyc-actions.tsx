"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAction } from "@/lib/use-action"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Volunteer = {
  name: string
  email: string
  phone?: string | null
  district?: string | null
  upazila?: string | null
  docType?: string | null
  docNumber?: string | null
  docImageUrl?: string | null
}

export function KycActions({ profileId, volunteer }: { profileId: number; volunteer: Volunteer }) {
  const { loading, error, run } = useAction()
  const [note, setNote] = useState("")
  const [open, setOpen] = useState(false)

  async function act(action: "approve" | "reject") {
    const ok = await run(action, `/api/admin/volunteers/${profileId}/kyc`, { action, note })
    if (ok) setOpen(false)
  }

  const fields = [
    { label: "Full Name", value: volunteer.name },
    { label: "Email", value: volunteer.email },
    { label: "Phone", value: volunteer.phone },
    { label: "District", value: volunteer.district },
    { label: "Upazila", value: volunteer.upazila },
    { label: "Document Type", value: volunteer.docType },
    { label: "Document Number", value: volunteer.docNumber },
  ].filter((f) => f.value)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Review KYC</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>KYC Review — {volunteer.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Volunteer info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border rounded-lg p-4 bg-muted/30">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                <p className="font-medium">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Document image */}
          {volunteer.docImageUrl ? (
            <a href={volunteer.docImageUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={volunteer.docImageUrl}
                alt="KYC document"
                className="rounded border max-h-64 object-contain w-full bg-muted"
                onError={(e) => {
                  const t = e.currentTarget
                  t.style.display = "none"
                  t.nextElementSibling?.removeAttribute("hidden")
                }}
              />
              <p hidden className="text-xs text-muted-foreground text-center py-3 border rounded">
                Image failed to load.{" "}
                <a href={volunteer.docImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Open directly
                </a>
              </p>
            </a>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4 border rounded">No document image uploaded.</p>
          )}

          <Input
            placeholder="Note (optional) — required for rejection"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" disabled={loading !== null} onClick={() => act("reject")}>
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </Button>
            <Button disabled={loading !== null} onClick={() => act("approve")}>
              {loading === "approve" ? "Approving..." : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
