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

export function KycActions({
  profileId,
  docImageUrl,
  docType,
}: {
  profileId: number
  docImageUrl?: string
  docType?: string
}) {
  const { loading, error, run } = useAction()
  const [note, setNote] = useState("")
  const [open, setOpen] = useState(false)

  async function act(action: "approve" | "reject") {
    // Keep the dialog open on failure so the admin sees the error and can retry.
    const ok = await run(action, `/api/admin/volunteers/${profileId}/kyc`, { action, note })
    if (ok) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline">Review KYC</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review KYC: {docType}</DialogTitle>
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
        {error && <p className="text-sm text-destructive">{error}</p>}
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
