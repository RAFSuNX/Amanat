import { db } from "@/db"
import { specialNeedApplications, beneficiaries, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { ApplicationActions } from "./application-actions"
import Link from "next/link"

const TABS = ["PENDING", "APPROVED", "REJECTED"] as const
type Tab = (typeof TABS)[number]

const statusVariant = (s: string) =>
  s === "APPROVED" ? "default" : s === "REJECTED" ? "destructive" : "secondary"

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "PENDING"

  const rows = await db
    .select({
      id: specialNeedApplications.id,
      title: specialNeedApplications.title,
      description: specialNeedApplications.description,
      amountRequested: specialNeedApplications.amountRequested,
      approvedAmount: specialNeedApplications.approvedAmount,
      status: specialNeedApplications.status,
      deliveryStatus: specialNeedApplications.deliveryStatus,
      adminNote: specialNeedApplications.adminNote,
      createdAt: specialNeedApplications.createdAt,
      beneficiaryName: beneficiaries.name,
      volunteerName: users.name,
    })
    .from(specialNeedApplications)
    .leftJoin(beneficiaries, eq(specialNeedApplications.beneficiaryId, beneficiaries.id))
    .leftJoin(users, eq(specialNeedApplications.submittedByVolunteerId, users.id))
    .orderBy(desc(specialNeedApplications.createdAt))

  const counts = {
    PENDING: rows.filter(r => r.status === "PENDING").length,
    APPROVED: rows.filter(r => r.status === "APPROVED").length,
    REJECTED: rows.filter(r => r.status === "REJECTED").length,
  }

  const filtered = rows.filter(r => r.status === tab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Special Need Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Emergency fund requests from volunteers for families with urgent needs.
          {counts.PENDING > 0 && <span className="text-amber-600 font-medium"> {counts.PENDING} pending review.</span>}
        </p>
      </div>

      <div className="flex gap-1 border-b border-border/40">
        {TABS.map(t => (
          <Link
            key={t}
            href={`?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
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
        {filtered.map((r) => (
          <div key={r.id} className="px-5 py-4 flex flex-col gap-2 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-base leading-tight truncate">{r.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                  {r.beneficiaryName && <span>{r.beneficiaryName}</span>}
                  {r.volunteerName && <><span className="opacity-30">·</span><span>via {r.volunteerName}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-bold tabular-nums">
                  ৳{parseFloat(r.amountRequested).toLocaleString("en-BD")}
                </span>
                <Badge variant={statusVariant(r.status)} className="text-xs">{r.status}</Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{r.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
                {r.approvedAmount && (
                  <><span className="opacity-30">·</span>
                  <span className="text-green-600 font-medium">
                    Approved ৳{parseFloat(r.approvedAmount).toLocaleString("en-BD")}
                  </span></>
                )}
                {r.deliveryStatus && r.deliveryStatus !== "PENDING" && (
                  <><span className="opacity-30">·</span>
                  <span className="capitalize">Delivery: {r.deliveryStatus.toLowerCase()}</span></>
                )}
                {r.adminNote && (
                  <><span className="opacity-30">·</span>
                  <span className="italic truncate max-w-xs">{r.adminNote}</span></>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/admin/applications/${r.id}`} className="text-xs font-medium text-primary hover:underline underline-offset-2">
                  View Details
                </Link>
                    {r.status === "PENDING" && <ApplicationActions id={r.id} title={r.title} beneficiaryName={r.beneficiaryName} amountRequested={r.amountRequested} />}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">
            No {tab.toLowerCase()} applications.
          </div>
        )}
      </div>
    </div>
  )
}
