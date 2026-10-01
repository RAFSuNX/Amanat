"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAction } from "@/lib/use-action"

export function DonationActions({
  donationId, donorName, amount, transactionRef,
}: {
  donationId: number
  donorName: string
  amount: string
  transactionRef: string
}) {
  const { loading, error, success, run } = useAction()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const act = async (action: "confirm" | "reject") => {
    await run(action, `/api/admin/donations/${donationId}/${action}`)
    setConfirmOpen(false)
    setRejectOpen(false)
  }

  if (success) return (
    <p className="text-xs text-primary font-medium">
      {success === "confirm" ? "Confirmed" : "Rejected"}
    </p>
  )

  const Details = () => (
    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground shrink-0">Donor</span>
        <span className="font-medium text-right">{donorName}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground shrink-0">Amount</span>
        <span className="font-bold text-right">৳{parseFloat(amount).toLocaleString("en-BD")}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground shrink-0">Transaction</span>
        <span className="font-mono text-xs text-right">{transactionRef}</span>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={loading !== null}>Confirm</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm this donation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the donation into the confirmed pool. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Details />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => act("confirm")} disabled={loading !== null}>
              {loading === "confirm" ? "Confirming..." : "Yes, Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={loading !== null}>Reject</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this donation?</AlertDialogTitle>
            <AlertDialogDescription>
              The donor will not be refunded automatically. Make sure this transaction is invalid before rejecting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Details />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => act("reject")}
              disabled={loading !== null}
            >
              {loading === "reject" ? "Rejecting..." : "Yes, Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
