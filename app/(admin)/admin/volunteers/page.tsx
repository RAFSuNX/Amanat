import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const TABS = ["PENDING_KYC", "APPROVED", "ALL"] as const
type Tab = (typeof TABS)[number]

export default async function AdminVolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "PENDING_KYC"

  const volunteers = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      district: volunteerProfiles.district,
      upazila: volunteerProfiles.upazila,
      kycStatus: volunteerProfiles.kycStatus,
      profileId: volunteerProfiles.id,
    })
    .from(users)
    .leftJoin(volunteerProfiles, eq(users.id, volunteerProfiles.userId))
    .where(eq(users.role, "VOLUNTEER"))

  const counts = {
    PENDING_KYC: volunteers.filter(v => v.kycStatus === "PENDING").length,
    APPROVED: volunteers.filter(v => v.kycStatus === "APPROVED").length,
    ALL: volunteers.length,
  }

  const filtered =
    tab === "PENDING_KYC"
      ? volunteers.filter(v => v.kycStatus === "PENDING")
      : tab === "APPROVED"
      ? volunteers.filter(v => v.kycStatus === "APPROVED")
      : volunteers

  const tabLabels: Record<Tab, string> = {
    PENDING_KYC: "Pending KYC",
    APPROVED: "Approved",
    ALL: "All",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Volunteers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.PENDING_KYC} pending KYC review · {counts.APPROVED} approved
          </p>
        </div>
        <Link href="/admin/volunteers/new">
          <Button>Add Volunteer</Button>
        </Link>
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
            {tabLabels[t]} ({counts[t]})
          </Link>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border/40 border border-border/60 rounded-xl overflow-hidden">
        {filtered.map((v) => (
          <div key={v.userId} className="px-5 py-4 flex flex-col gap-2 hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-base leading-tight">{v.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                  <span>{v.email}</span>
                  {v.phone && <><span className="opacity-30">·</span><span>{v.phone}</span></>}
                </div>
              </div>
              <div className="shrink-0">
                {v.kycStatus ? (
                  <Badge
                    variant={
                      v.kycStatus === "APPROVED" ? "default"
                      : v.kycStatus === "REJECTED" ? "destructive"
                      : "secondary"
                    }
                    className="text-xs"
                  >
                    KYC: {v.kycStatus}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground border border-border/40 rounded px-2 py-0.5">No KYC</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {v.district && <span>{v.district}{v.upazila ? `, ${v.upazila}` : ""}</span>}
                <span className="opacity-30">·</span>
                <span>Joined {v.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {v.profileId && (
                  <Link href={`/admin/volunteers/${v.profileId}`} className="text-xs font-medium text-primary hover:underline underline-offset-2">
                    View Details
                  </Link>
                )}
                {v.kycStatus === "PENDING" && v.profileId && (
                  <Link href={`/admin/volunteers/${v.profileId}/kyc`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">Review KYC</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">
            No volunteers in this tab.{" "}
            {tab === "PENDING_KYC" && (
              <Link href="/admin/volunteers/new" className="underline">Add the first one</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
