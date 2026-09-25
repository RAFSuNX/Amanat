"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAction } from "@/lib/use-action"

export function BeneficiaryActions({ id }: { id: number }) {
  const { loading, error, success, run } = useAction()
  const [note, setNote] = useState("")
  const [showNote, setShowNote] = useState(false)

  const act = (action: "approve" | "reject") =>
    run(action, `/api/admin/beneficiaries/${id}/${action}`, { note })

  if (success) return (
    <p className="text-xs text-primary font-medium">
      {success === "approve" ? "Approved" : "Rejected"}
    </p>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={loading !== null} onClick={() => act("approve")}>
          {loading === "approve" ? "Approving..." : "Approve"}
        </Button>
        <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => setShowNote(!showNote)}>
          Reject
        </Button>
      </div>
      {showNote && (
        <div className="flex gap-2">
          <Input placeholder="Reason for rejection" value={note} onChange={e => setNote(e.target.value)} className="text-xs" />
          <Button size="sm" variant="destructive" disabled={loading !== null} onClick={() => act("reject")}>
            {loading === "reject" ? "Rejecting..." : "Confirm"}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
