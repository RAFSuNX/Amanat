"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAction } from "@/lib/use-action"

export function ApplicationActions({
  id, title, beneficiaryName, amountRequested,
}: {
  id: number
  title: string
  beneficiaryName?: string | null
  amountRequested: string
}) {
  const { loading, error, success, setError, run } = useAction()
  const [approvedAmount, setApprovedAmount] = useState(amountRequested)
  const [note, setNote] = useState("")
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  async function handleApprove() {
    const amt = Number(approvedAmount)
    if (!approvedAmount.trim() || !Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount greater than 0.")
      return
    }
    await run("approve", `/api/admin/applications/${id}/approve`, { approvedAmount: amt, note })
    setApproveOpen(false)
  }

  async function handleReject() {
    await run("reject", `/api/admin/applications/${id}/reject`, { note })
    setRejectOpen(false)
  }

  if (success) return (
    <p className="text-xs text-primary font-medium">
      {success === "approve" ? "Approved" : "Rejected"}
    </p>
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={loading !== null}>Approve</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {beneficiaryName
                ? `Approving funds for ${beneficiaryName}: ${title}`
                : title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Requested</span>
              <span className="font-bold">৳{parseFloat(amountRequested).toLocaleString("en-BD")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Approved amount (BDT)</label>
              <Input
                type="number" min="0" step="0.01"
                value={approvedAmount}
                onChange={e => setApprovedAmount(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Admin note (optional)</label>
              <Input
                placeholder="Notes for this approval"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading !== null}>
              {loading === "approve" ? "Approving..." : "Yes, Approve"}
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
            <AlertDialogTitle>Reject this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {beneficiaryName
                ? `Rejecting the request for ${beneficiaryName}: ${title}`
                : title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5 px-1">
            <label className="text-xs text-muted-foreground">Reason (optional)</label>
            <Input
              placeholder="Reason for rejection"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleReject}
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
