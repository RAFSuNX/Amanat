"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function KycActions({
  profileId,
  docImageUrl,
  docType,
}: {
  profileId: number
  docImageUrl?: string
  docType?: string
}) {
  const router = useRouter()
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [open, setOpen] = useState(false)

  async function act(action: "approve" | "reject") {
    setLoading(action)
    await fetch(`/api/admin/volunteers/${profileId}/kyc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    })
    setLoading(null)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline">Review KYC</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review KYC — {docType}</DialogTitle>
        </DialogHeader>
        {docImageUrl && (
          <a href={docImageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={docImageUrl}
              alt="KYC document"
              className="rounded border max-h-64 object-contain w-full"
            />
          </a>
        )}
        <Input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() => act("reject")}
          >
            {loading === "reject" ? "…" : "Reject"}
          </Button>
          <Button disabled={loading !== null} onClick={() => act("approve")}>
            {loading === "approve" ? "…" : "Approve"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
