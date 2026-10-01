import { db } from "@/db"
import { specialNeedApplications, beneficiaries, users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { parseId } from "@/lib/http"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ApplicationActions } from "../application-actions"

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const { id: idStr } = await params
  const id = parseId(idStr)
  if (!id) redirect("/admin/applications")

  const [row] = await db
    .select({
      id: specialNeedApplications.id,
      title: specialNeedApplications.title,
      description: specialNeedApplications.description,
      amountRequested: specialNeedApplications.amountRequested,
      approvedAmount: specialNeedApplications.approvedAmount,
      status: specialNeedApplications.status,
      adminNote: specialNeedApplications.adminNote,
      deliveryStatus: specialNeedApplications.deliveryStatus,
      createdAt: specialNeedApplications.createdAt,
      submittedByVolunteerId: specialNeedApplications.submittedByVolunteerId,
      beneficiaryId: beneficiaries.id,
      beneficiaryName: beneficiaries.name,
      beneficiaryType: beneficiaries.type,
      beneficiaryDistrict: beneficiaries.district,
      volunteerName: users.name,
      volunteerEmail: users.email,
    })
    .from(specialNeedApplications)
    .leftJoin(beneficiaries, eq(specialNeedApplications.beneficiaryId, beneficiaries.id))
    .leftJoin(users, eq(specialNeedApplications.submittedByVolunteerId, users.id))
    .where(eq(specialNeedApplications.id, id))

  if (!row) redirect("/admin/applications")

  const volunteerProfile = row.submittedByVolunteerId
    ? await db.query.volunteerProfiles.findFirst({
        where: eq(volunteerProfiles.userId, row.submittedByVolunteerId),
      })
    : null

  const statusVariant =
    row.status === "APPROVED" ? "default" : row.status === "REJECTED" ? "destructive" : "secondary"

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <Link href="/admin/applications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        &larr; Back to Applications
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Application #{row.id}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{row.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {row.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </p>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1 shrink-0">{row.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Application Details</p>
            </div>
            <div className="divide-y divide-border/40">
              <div className="px-5 py-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{row.description}</p>
              </div>
              {[
                { label: "Amount Requested", value: `${parseFloat(row.amountRequested).toLocaleString("en-BD")} BDT` },
                row.approvedAmount ? { label: "Approved Amount", value: `${parseFloat(row.approvedAmount).toLocaleString("en-BD")} BDT` } : null,
                row.adminNote ? { label: "Admin Note", value: row.adminNote } : null,
                { label: "Delivery Status", value: row.deliveryStatus ?? "Not set" },
              ].filter(Boolean).map((f) => (
                <div key={f!.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f!.label}</p>
                  <p className="text-sm font-medium break-all">{f!.value}</p>
                </div>
              ))}
            </div>
          </div>

          {row.status === "PENDING" && (
            <div className="border border-border/60 rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision</p>
              <ApplicationActions id={row.id} title={row.title} beneficiaryName={row.beneficiaryName} amountRequested={row.amountRequested} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {row.beneficiaryId && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Beneficiary</p>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { label: "Name", value: row.beneficiaryName },
                  { label: "Type", value: row.beneficiaryType },
                  { label: "District", value: row.beneficiaryDistrict },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium">{f.value}</p>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <Link href={`/admin/beneficiaries/${row.beneficiaryId}`} className="text-xs text-primary hover:underline underline-offset-2">
                    View full beneficiary record &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Submitted By</p>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "Volunteer Name", value: row.volunteerName },
                { label: "Email", value: row.volunteerEmail },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium">{f.value}</p>
                </div>
              ))}
              {volunteerProfile && (
                <div className="px-5 py-3">
                  <Link href={`/admin/volunteers/${volunteerProfile.id}`} className="text-xs text-primary hover:underline underline-offset-2">
                    View volunteer profile &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
