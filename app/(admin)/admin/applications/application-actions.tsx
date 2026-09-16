"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAction } from "@/lib/use-action"

export function ApplicationActions({ id }: { id: number }) {
  const { loading, error, setError, run } = useAction()
  const [approvedAmount, setApprovedAmount] = useState("")
  const [note, setNote] = useState("")
  const [showReject, setShowReject] = useState(false)

  async function act(action: "approve" | "reject") {
    if (action === "approve") {
      const amt = Number(approvedAmount)
      if (!approvedAmount.trim() || !Number.isFinite(amt) || amt <= 0) {
        setError("Enter a valid amount greater than 0.")
        return
      }
      await run(action, `/api/admin/applications/${id}/approve`, { approvedAmount: amt, note })
    } else {
      await run(action, `/api/admin/applications/${id}/reject`, { note })
    }
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex gap-1.5 items-center">
        <Input type="number" min="0" step="0.01" placeholder="Amount" value={approvedAmount}
          onChange={e => setApprovedAmount(e.target.value)} className="h-8 text-xs w-24" />
        <Button size="sm" disabled={loading !== null || !approvedAmount} onClick={() => act("approve")}>
          {loading === "approve" ? "..." : "Approve"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReject(!showReject)}>
          Reject
        </Button>
      </div>
      {showReject && (
        <div className="flex gap-1.5">
          <Input placeholder="Reason" value={note} onChange={e => setNote(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" variant="destructive" disabled={loading !== null} onClick={() => act("reject")}>
            {loading === "reject" ? "..." : "Confirm"}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
