"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function DonationActions({ donationId }: { donationId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null)

  async function act(action: "confirm" | "reject") {
    setLoading(action)
    await fetch(`/api/admin/donations/${donationId}/${action}`, { method: "POST" })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={loading !== null}
        onClick={() => act("confirm")}
      >
        {loading === "confirm" ? "…" : "Confirm"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => act("reject")}
      >
        {loading === "reject" ? "…" : "Reject"}
      </Button>
    </div>
  )
}
