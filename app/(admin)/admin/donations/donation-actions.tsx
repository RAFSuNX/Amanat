"use client"

import { Button } from "@/components/ui/button"
import { useAction } from "@/lib/use-action"

export function DonationActions({ donationId }: { donationId: number }) {
  const { loading, error, run } = useAction()
  const act = (action: "confirm" | "reject") =>
    run(action, `/api/admin/donations/${donationId}/${action}`)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button size="sm" disabled={loading !== null} onClick={() => act("confirm")}>
          {loading === "confirm" ? "…" : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => act("reject")}>
          {loading === "reject" ? "…" : "Reject"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
