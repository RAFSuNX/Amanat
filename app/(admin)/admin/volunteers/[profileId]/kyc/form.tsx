"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/lib/use-action"

export function KycReviewForm({ profileId }: { profileId: number }) {
  const router = useRouter()
  const { loading, error, success, run } = useAction()
  const [note, setNote] = useState("")

  async function act(action: "approve" | "reject") {
    if (action === "reject" && !note.trim()) {
      return
    }
    const ok = await run(action, `/api/admin/volunteers/${profileId}/kyc`, { action, note })
    if (ok) router.push("/admin/volunteers")
  }

  if (success) return <p className="text-sm text-primary font-medium">Done — redirecting...</p>

  return (
    <div className="flex flex-col gap-4 border border-border/60 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision</p>
      <Textarea
        placeholder="Note — required for rejection, optional for approval"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="resize-none"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button
          variant="destructive"
          disabled={loading !== null || !note.trim()}
          onClick={() => act("reject")}
          className="flex-1"
        >
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </Button>
        <Button
          disabled={loading !== null}
          onClick={() => act("approve")}
          className="flex-1"
        >
          {loading === "approve" ? "Approving..." : "Approve"}
        </Button>
      </div>
      {!note.trim() && <p className="text-xs text-muted-foreground">A note is required to reject.</p>}
    </div>
  )
}
