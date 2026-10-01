import { db } from "@/db"
import { beneficiaries, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { BeneficiaryActions } from "./beneficiary-actions"
import Link from "next/link"

const TABS = ["PENDING", "ACTIVE", "REJECTED"] as const
type Tab = (typeof TABS)[number]

export default async function AdminBeneficiariesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "PENDING"

  const rows = await db
    .select({
      id: beneficiaries.id,
      name: beneficiaries.name,
      type: beneficiaries.type,
      district: beneficiaries.district,
      status: beneficiaries.status,
      createdAt: beneficiaries.createdAt,
      volunteerName: users.name,
    })
    .from(beneficiaries)
    .leftJoin(users, eq(beneficiaries.registeredByVolunteerId, users.id))
    .orderBy(desc(beneficiaries.createdAt))

  const counts = {
    PENDING: rows.filter(r => r.status === "PENDING").length,
    ACTIVE: rows.filter(r => r.status === "ACTIVE").length,
    REJECTED: rows.filter(r => r.status === "REJECTED").length,
  }

  const filtered = rows.filter(r => r.status === tab)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beneficiaries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {counts.PENDING} pending review · {counts.ACTIVE} active
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
        {filtered.map(r => (
          <div key={r.id} className="px-5 py-4 flex flex-col gap-2 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-base leading-tight">{r.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                  <span className="border border-border/50 rounded px-1.5 py-0.5 font-medium text-foreground/70 uppercase tracking-wide text-[10px]">
                    {r.type}
                  </span>
                  <span>{r.district}</span>
                  {r.volunteerName && <><span className="opacity-30">·</span><span>Registered by {r.volunteerName}</span></>}
                </div>
              </div>
              <Badge
                variant={r.status === "ACTIVE" ? "default" : r.status === "REJECTED" ? "destructive" : "secondary"}
                className="shrink-0 text-xs"
              >
                {r.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                {r.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/admin/beneficiaries/${r.id}`} className="text-xs font-medium text-primary hover:underline underline-offset-2">
                  View Details
                </Link>
                {r.status === "PENDING" && <BeneficiaryActions id={r.id} name={r.name} />}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">
            No {tab.toLowerCase()} beneficiaries.
          </div>
        )}
      </div>
    </div>
  )
}
