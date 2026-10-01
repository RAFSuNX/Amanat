import { db } from "@/db"
import { beneficiaries, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { parseId } from "@/lib/http"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BeneficiaryActions } from "../beneficiary-actions"
import { MemberForm } from "./member-form"
import { PrintButton } from "./print-button"

export default async function BeneficiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const { id: idStr } = await params
  const id = parseId(idStr)
  if (!id) redirect("/admin/beneficiaries")

  const b = await db.query.beneficiaries.findFirst({
    where: eq(beneficiaries.id, id),
    with: {
      members: { orderBy: (m, { asc }) => [asc(m.id)] },
      needAssessments: { orderBy: (n, { desc }) => [desc(n.createdAt)] },
    },
  })

  if (!b) redirect("/admin/beneficiaries")

  const [volunteer, reviewer] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, b.registeredByVolunteerId) }),
    b.reviewedByAdminId
      ? db.query.users.findFirst({ where: eq(users.id, b.reviewedByAdminId) })
      : Promise.resolve(null),
  ])

  const statusVariant =
    b.status === "ACTIVE" ? "default" : b.status === "REJECTED" ? "destructive" : "secondary"

  const earners = b.members.filter(m => m.isEarner).length
  const disabled = b.members.filter(m => m.isDisabled).length
  const children = b.members.filter(m => m.age < 12).length
  const elderly = b.members.filter(m => m.age >= 60).length

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 print:gap-4">
      <div className="flex items-start justify-between print:hidden">
        <Link href="/admin/beneficiaries" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Beneficiaries
        </Link>
        <PrintButton />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Beneficiary #{b.id}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{b.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{b.type} &middot; {b.district}{b.upazila ? `, ${b.upazila}` : ""}</p>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1 shrink-0">{b.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal Information</p>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { label: "Full Name", value: b.name },
              { label: "Phone", value: b.phone },
              { label: "NID Number", value: b.nidNumber },
              { label: "Type", value: b.type },
              { label: "Division", value: b.division },
              { label: "District", value: b.district },
              { label: "Upazila", value: b.upazila },
              { label: "Union", value: b.union },
              { label: "Village", value: b.village },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="px-5 py-3 flex justify-between gap-4">
                <p className="text-xs text-muted-foreground shrink-0">{f.label}</p>
                <p className="text-sm font-medium text-right break-all">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Registration</p>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "Registered By", value: volunteer?.name },
                { label: "Registered On", value: b.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" }) },
                { label: "Reviewed By", value: reviewer?.name },
                { label: "Reviewed On", value: b.reviewedAt?.toLocaleDateString("en-GB", { dateStyle: "medium" }) },
                { label: "Admin Note", value: b.adminNote },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="px-5 py-3 flex justify-between gap-4">
                  <p className="text-xs text-muted-foreground shrink-0">{f.label}</p>
                  <p className="text-sm font-medium text-right break-all">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {b.photoUrl && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Photo</p>
              </div>
              <div className="p-4">
                <img src={b.photoUrl} alt={b.name} className="w-24 h-24 object-cover rounded-lg border" />
              </div>
            </div>
          )}

          {b.status === "PENDING" && (
            <div className="border border-border/60 rounded-xl p-5 flex flex-col gap-3 print:hidden">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision</p>
              <BeneficiaryActions id={b.id} name={b.name} />
            </div>
          )}
        </div>
      </div>

      {/* Household Members */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Household Members ({b.members.length})
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            {earners > 0 && <span>{earners} earner{earners > 1 ? "s" : ""}</span>}
            {children > 0 && <span>{children} child{children > 1 ? "ren" : ""}</span>}
            {elderly > 0 && <span>{elderly} elderly</span>}
            {disabled > 0 && <span>{disabled} disabled</span>}
          </div>
        </div>
        {b.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Name</th>
                  <th className="px-5 py-2.5 text-left font-medium">Relation</th>
                  <th className="px-5 py-2.5 text-left font-medium">Age</th>
                  <th className="px-5 py-2.5 text-left font-medium">Earner</th>
                  <th className="px-5 py-2.5 text-left font-medium">Disabled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {b.members.map(m => (
                  <tr key={m.id}>
                    <td className="px-5 py-3 font-medium">{m.name}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{m.relation}</td>
                    <td className="px-5 py-3 text-muted-foreground">{m.age}</td>
                    <td className="px-5 py-3">
                      {m.isEarner
                        ? <Badge variant="default" className="text-xs">Yes</Badge>
                        : <span className="text-muted-foreground text-xs">No</span>}
                    </td>
                    <td className="px-5 py-3">
                      {m.isDisabled
                        ? <Badge variant="destructive" className="text-xs">Yes</Badge>
                        : <span className="text-muted-foreground text-xs">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No members recorded yet.</p>
        )}
        <div className="border-t border-border/40 p-5 print:hidden">
          <MemberForm beneficiaryId={b.id} />
        </div>
      </div>

      {/* Need Assessments */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Need Assessments ({b.needAssessments.length})
          </p>
        </div>
        {b.needAssessments.length > 0 ? (
          <div className="divide-y divide-border/40">
            {b.needAssessments.map(n => (
              <div key={n.id} className="px-5 py-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.period}</p>
                  <p className="text-sm font-bold text-primary">
                    {parseFloat(n.declaredMonthlyNeed).toLocaleString("en-BD")} BDT/month
                  </p>
                </div>
                {n.notes && <p className="text-xs text-muted-foreground">{n.notes}</p>}
                <p className="text-[10px] text-muted-foreground">
                  {n.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })} &middot; {n.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No assessments on record.</p>
        )}
      </div>
    </div>
  )
}
