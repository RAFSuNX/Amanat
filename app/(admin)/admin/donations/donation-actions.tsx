"use client"

import { Button } from "@/components/ui/button"
import { useAction } from "@/lib/use-action"

export function DonationActions({ donationId }: { donationId: number }) {
  const { loading, error, success, run } = useAction()
  const act = (action: "confirm" | "reject") =>
    run(action, `/api/admin/donations/${donationId}/${action}`)

  if (success) return (
    <p className="text-xs text-primary font-medium">
      {success === "confirm" ? "Confirmed" : "Rejected"}
    </p>
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button size="sm" disabled={loading !== null} onClick={() => act("confirm")}>
          {loading === "confirm" ? "Confirming..." : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => act("reject")}>
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
