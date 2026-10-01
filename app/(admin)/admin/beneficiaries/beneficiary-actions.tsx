"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAction } from "@/lib/use-action"

export function BeneficiaryActions({ id, name }: { id: number; name: string }) {
  const { loading, error, success, run } = useAction()
  const [note, setNote] = useState("")
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const act = async (action: "approve" | "reject") => {
    await run(action, `/api/admin/beneficiaries/${id}/${action}`, { note })
    setApproveOpen(false)
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
            <AlertDialogTitle>Approve this beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving will mark <strong>{name}</strong> as ACTIVE and allow them to receive distributions. This action is logged and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => act("approve")} disabled={loading !== null}>
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
            <AlertDialogTitle>Reject this beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>
              Rejecting <strong>{name}</strong> will prevent them from receiving any distributions. Provide a reason to help the volunteer understand the decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5 px-1">
            <label className="text-xs text-muted-foreground">Reason (optional)</label>
            <Input
              placeholder="e.g. Duplicate registration, documents unclear"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="text-sm"
            />
          </div>
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
