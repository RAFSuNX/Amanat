"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DeliveryActions({
  allotmentId,
  deliveryStatus,
  cycleStatus,
  isFlagged,
  flagNote,
}: {
  allotmentId: number
  deliveryStatus: string
  cycleStatus: string
  isFlagged: boolean
  flagNote: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showFlag, setShowFlag] = useState(false)
  const [note, setNote] = useState(flagNote)

  async function act(action: "deliver" | "flag") {
    setLoading(action)
    await fetch(`/api/volunteer/deliveries/${allotmentId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    })
    setLoading(null)
    setShowFlag(false)
    router.refresh()
  }

  if (deliveryStatus === "DELIVERED") {
    return <span className="text-xs text-muted-foreground">Delivered</span>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {cycleStatus === "ACTIVE" && (
          <Button size="sm" disabled={loading !== null} onClick={() => act("deliver")}>
            {loading === "deliver" ? "..." : "Mark Delivered"}
          </Button>
        )}
        {(cycleStatus === "VOLUNTEER_REVIEW" || cycleStatus === "ACTIVE") && (
          <Button size="sm" variant="outline" onClick={() => setShowFlag(!showFlag)}>
            {isFlagged ? "Edit Flag" : "Flag"}
          </Button>
        )}
      </div>
      {showFlag && (
        <div className="flex gap-2">
          <Input
            placeholder="Reason for flagging..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs"
          />
          <Button size="sm" disabled={loading !== null} onClick={() => act("flag")}>
            {loading === "flag" ? "..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  )
}
