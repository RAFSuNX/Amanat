"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ApplicationActions({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [approvedAmount, setApprovedAmount] = useState("")
  const [note, setNote] = useState("")
  const [showReject, setShowReject] = useState(false)

  async function act(action: "approve" | "reject") {
    if (action === "approve" && !approvedAmount) return
    setLoading(action)
    await fetch(`/api/admin/applications/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedAmount: action === "approve" ? Number(approvedAmount) : undefined, note }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex gap-1.5 items-center">
        <Input type="number" placeholder="Amount" value={approvedAmount}
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
    </div>
  )
}
