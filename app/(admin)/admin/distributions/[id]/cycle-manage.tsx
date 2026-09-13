"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { finalAmount } from "@/lib/allotment"

type Row = {
  id: number
  beneficiaryName: string
  district: string
  requestedAmount: string
  allocatedAmount: string | null
  manualOverrideAmount: string | null
  volunteerRequestedAmount: string | null
  volunteerFlagNote: string | null
  volunteerReceiptUrl: string | null
  isFlagged: boolean
  deliveryStatus: string
}

type Cycle = {
  id: number
  status: string
  totalPool: string
  specialDeductionTotal: string
  remainingPool: string | null
}

const money = (n: number) => `${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })} BDT`
const finalOf = (r: Row) => finalAmount(r)

export function CycleManage({ cycle, rows }: { cycle: Cycle; rows: Row[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  // Local override edits (ADMIN_REVIEW only) keyed by allotment id.
  const [edits, setEdits] = useState<Record<number, string>>(
    () => Object.fromEntries(rows.map((r) => [r.id, String(finalOf(r))]))
  )

  const isReview = cycle.status === "ADMIN_REVIEW"
  const cap = parseFloat(cycle.totalPool) - parseFloat(cycle.specialDeductionTotal)

  // Live total uses edited values in review, otherwise the stored final amounts.
  const total = rows.reduce(
    (s, r) => s + (isReview ? parseFloat(edits[r.id] || "0") || 0 : finalOf(r)),
    0
  )
  const remaining = cap - total
  const overCap = remaining < -0.001

  async function post(body: Record<string, unknown>) {
    setError("")
    setBusy(true)
    const res = await fetch(`/api/admin/distributions/${cycle.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Action failed.")
      return false
    }
    router.refresh()
    return true
  }

  const delivered = rows.filter((r) => r.deliveryStatus === "DELIVERED").length

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border">
        {[
          { label: "Total Pool", value: money(parseFloat(cycle.totalPool)) },
          { label: "Special Reserve", value: money(parseFloat(cycle.specialDeductionTotal)) },
          { label: "Allocated", value: money(total) },
          {
            label: "Remaining",
            value: money(remaining),
            color: overCap ? "text-destructive" : "text-primary",
          },
        ].map((s) => (
          <div key={s.label} className="bg-card px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-lg font-bold tabular-nums ${s.color ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Stage actions */}
      <div className="flex flex-wrap items-center gap-3">
        {cycle.status === "DRAFT" && (
          <>
            <Button disabled={busy} onClick={() => post({ action: "calculate" })}>
              {busy ? "…" : "Calculate distribution"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Splits the pool across all approved families, then opens volunteer review.
            </span>
          </>
        )}
        {cycle.status === "VOLUNTEER_REVIEW" && (
          <>
            <Button disabled={busy} onClick={() => post({ action: "close-review" })}>
              {busy ? "…" : "Close volunteer review"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Volunteers can request adjustments until you close review.
            </span>
          </>
        )}
        {cycle.status === "ADMIN_REVIEW" && (
          <>
            <Button
              disabled={busy || overCap}
              onClick={async () => {
                if (confirm("Activate this cycle? Amounts lock and volunteers can begin delivery.")) {
                  await post({ action: "activate" })
                }
              }}
            >
              {busy ? "…" : "Activate cycle"}
            </Button>
            {overCap && (
              <span className="text-xs text-destructive">
                Allocation exceeds the pool by {money(-remaining)}. Reduce amounts to activate.
              </span>
            )}
          </>
        )}
        {cycle.status === "ACTIVE" && (
          <>
            <Button
              disabled={busy}
              onClick={async () => {
                if (confirm("Mark this cycle complete? It will be published on the public ledger.")) {
                  await post({ action: "complete" })
                }
              }}
            >
              {busy ? "…" : "Complete & publish"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {delivered} of {rows.length} deliveries recorded.
            </span>
          </>
        )}
        {cycle.status === "COMPLETED" && (
          <span className="text-sm text-muted-foreground">
            Completed and published. {delivered} of {rows.length} families delivered.
          </span>
        )}
      </div>

      {/* Allotments */}
      {rows.length === 0 ? (
        <div className="border border-border/40 rounded p-8 text-center text-muted-foreground text-sm">
          {cycle.status === "DRAFT"
            ? "No allotments yet. Calculate the distribution to generate them."
            : "No eligible families were found for this cycle."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>District</TableHead>
              <TableHead className="text-right">Need</TableHead>
              <TableHead className="text-right">Calculated</TableHead>
              <TableHead>Volunteer Request</TableHead>
              <TableHead className="text-right">{isReview ? "Final Amount" : "Final"}</TableHead>
              {(cycle.status === "ACTIVE" || cycle.status === "COMPLETED") && <TableHead>Delivery</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.beneficiaryName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.district}</TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {parseFloat(r.requestedAmount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {r.allocatedAmount ? parseFloat(r.allocatedAmount).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="max-w-[16rem]">
                  {r.isFlagged ? (
                    <div className="flex flex-col gap-0.5">
                      {r.volunteerRequestedAmount && (
                        <span className="text-sm font-medium tabular-nums">
                          {parseFloat(r.volunteerRequestedAmount).toLocaleString()} BDT
                        </span>
                      )}
                      {r.volunteerFlagNote && (
                        <span className="text-xs text-muted-foreground">{r.volunteerFlagNote}</span>
                      )}
                      {r.volunteerReceiptUrl && (
                        <a href={r.volunteerReceiptUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-primary hover:underline">View receipt</a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isReview ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Input
                        type="number" min="0" step="0.01"
                        value={edits[r.id] ?? ""}
                        onChange={(e) => setEdits((s) => ({ ...s, [r.id]: e.target.value }))}
                        className="w-28 text-right tabular-nums h-8"
                      />
                      <Button size="sm" variant="outline" disabled={busy}
                        onClick={() => post({ action: "override", allotmentId: r.id, amount: Number(edits[r.id] || 0) })}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <span className="tabular-nums font-medium">{money(finalOf(r))}</span>
                  )}
                </TableCell>
                {(cycle.status === "ACTIVE" || cycle.status === "COMPLETED") && (
                  <TableCell>
                    <Badge variant={r.deliveryStatus === "DELIVERED" ? "default" : "secondary"}>
                      {r.deliveryStatus}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
