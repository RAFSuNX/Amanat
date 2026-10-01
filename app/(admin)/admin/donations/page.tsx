import { db } from "@/db"
import { donations } from "@/db/schema"
import { desc } from "drizzle-orm"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DonationActions } from "./donation-actions"

const TABS = ["PENDING", "CONFIRMED", "REJECTED"] as const
type Tab = (typeof TABS)[number]

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "PENDING"

  const rows = await db.query.donations.findMany({
    orderBy: [desc(donations.createdAt)],
  })

  const counts = {
    PENDING: rows.filter(r => r.status === "PENDING").length,
    CONFIRMED: rows.filter(r => r.status === "CONFIRMED").length,
    REJECTED: rows.filter(r => r.status === "REJECTED").length,
  }

  const filtered = rows.filter(r => r.status === tab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Donations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {counts.PENDING} pending · {counts.CONFIRMED} confirmed
        </p>
      </div>

      <div className="flex gap-1 border-b border-border/40">
        {TABS.map(t => (
          <Link
            key={t}
            href={`?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "border-b-2 border-foreground text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()} ({counts[t]})
          </Link>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border/40 border border-border/60 rounded-xl overflow-hidden">
        {filtered.map((d) => (
          <div key={d.id} className="px-5 py-4 flex flex-col gap-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-base leading-tight">{d.donorName}</p>
                  {d.isAnonymous && (
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
                      Public: Anonymous
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                  {(d.donorPhone || d.donorEmail) && (
                    <span className="inline-flex items-stretch border border-border/50 rounded text-[11px] font-medium text-foreground/70 overflow-hidden">
                      {d.donorPhone && (
                        <span className="px-2 py-0.5">{d.donorPhone}</span>
                      )}
                      {d.donorPhone && d.donorEmail && (
                        <span className="border-l border-border/50 self-stretch" />
                      )}
                      {d.donorEmail && (
                        <span className="px-2 py-0.5">{d.donorEmail}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xl font-bold tabular-nums">
                  ৳{parseFloat(d.amount).toLocaleString("en-BD")}
                </span>
                <Badge
                  variant={
                    d.status === "CONFIRMED" ? "default"
                    : d.status === "REJECTED" ? "destructive"
                    : "secondary"
                  }
                  className="text-xs shrink-0"
                >
                  {d.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="border border-border/50 rounded px-2 py-0.5 font-medium text-foreground/70 uppercase tracking-wide text-[10px]">
                  {d.method}
                </span>
                <span className="font-mono text-xs">{d.transactionRef}</span>
                <span className="opacity-30">·</span>
                <span>{d.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                {d.confirmedAt && (
                  <><span className="opacity-30">·</span><span className="text-green-600">Confirmed {d.confirmedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span></>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {d.receiptImageUrl && (
                  <a href={d.receiptImageUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    Receipt
                  </a>
                )}
                <Link href={`/admin/donations/${d.id}`}
                  className="text-xs font-medium text-primary hover:underline underline-offset-2">
                  View Details
                </Link>
                {d.status === "PENDING" && <DonationActions donationId={d.id} donorName={d.donorName} amount={d.amount} transactionRef={d.transactionRef} />}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">
            No {tab.toLowerCase()} donations.
          </div>
        )}
      </div>
    </div>
  )
}
