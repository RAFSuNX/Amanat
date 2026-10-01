import { db } from "@/db"
import { users, volunteerProfiles, beneficiaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { parseId } from "@/lib/http"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function resolveDocUrl(value: string | null): { url: string; isPdf: boolean } | null {
  if (!value) return null
  const isPdf = value.toLowerCase().endsWith(".pdf")
  if (value.startsWith("http")) return { url: value, isPdf }
  const k = Buffer.from(value, "utf-8").toString("base64url")
  return { url: `/api/admin/kyc-doc?k=${k}`, isPdf }
}

function DocViewer({ url, label, isPdf }: { url: string; label: string; isPdf: boolean }) {
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline underline-offset-2">
          Open full size &rarr;
        </a>
      </div>
      {isPdf ? (
        <div className="flex items-center justify-center h-40 gap-3 flex-col">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline underline-offset-2 font-medium">
            View PDF Document
          </a>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="w-full object-contain max-h-[50vh]" />
        </a>
      )}
    </div>
  )
}

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const { profileId: profileIdStr } = await params
  const profileId = parseId(profileIdStr)
  if (!profileId) redirect("/admin/volunteers")

  const [v] = await db
    .select({
      profileId: volunteerProfiles.id,
      userId: volunteerProfiles.userId,
      kycStatus: volunteerProfiles.kycStatus,
      kycDocType: volunteerProfiles.kycDocType,
      kycDocNumber: volunteerProfiles.kycDocNumber,
      kycDocImageUrl: volunteerProfiles.kycDocImageUrl,
      kycDocBackImageUrl: volunteerProfiles.kycDocBackImageUrl,
      passportPhotoUrl: volunteerProfiles.passportPhotoUrl,
      kycReviewNote: volunteerProfiles.kycReviewNote,
      kycReviewedAt: volunteerProfiles.kycReviewedAt,
      district: volunteerProfiles.district,
      upazila: volunteerProfiles.upazila,
      presentAddress: volunteerProfiles.presentAddress,
      permanentAddress: volunteerProfiles.permanentAddress,
      name: users.name,
      email: users.email,
      phone: users.phone,
      joinedAt: users.createdAt,
    })
    .from(volunteerProfiles)
    .innerJoin(users, eq(volunteerProfiles.userId, users.id))
    .where(eq(volunteerProfiles.id, profileId))

  if (!v) redirect("/admin/volunteers")

  const [reviewerUser, registeredBeneficiaries] = await Promise.all([
    db.query.volunteerProfiles.findFirst({ where: eq(volunteerProfiles.id, profileId) })
      .then(async (vp) => {
        if (!vp?.kycReviewedByAdminId) return null
        return db.query.users.findFirst({ where: eq(users.id, vp.kycReviewedByAdminId) })
      }),
    db.select({
      id: beneficiaries.id,
      name: beneficiaries.name,
      type: beneficiaries.type,
      district: beneficiaries.district,
      status: beneficiaries.status,
      createdAt: beneficiaries.createdAt,
    })
      .from(beneficiaries)
      .where(eq(beneficiaries.registeredByVolunteerId, v.userId)),
  ])

  const frontUrl = resolveDocUrl(v.kycDocImageUrl)
  const backUrl = resolveDocUrl(v.kycDocBackImageUrl)

  const kycVariant =
    v.kycStatus === "APPROVED" ? "default" : v.kycStatus === "REJECTED" ? "destructive" : "secondary"

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link href="/admin/volunteers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Volunteers
        </Link>
        {v.kycStatus === "PENDING" && (
          <Link href={`/admin/volunteers/${profileId}/kyc`}>
            <Button size="sm" variant="outline">Review KYC</Button>
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Volunteer #{profileId}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{v.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{v.district}{v.upazila ? `, ${v.upazila}` : ""}</p>
        </div>
        <Badge variant={kycVariant} className="text-sm px-3 py-1 shrink-0">KYC {v.kycStatus}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal Information</p>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "Full Name", value: v.name },
                { label: "Email", value: v.email },
                { label: "Phone", value: v.phone },
                { label: "Joined", value: v.joinedAt.toLocaleDateString("en-GB", { dateStyle: "medium" }) },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium break-all">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</p>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "District", value: v.district },
                { label: "Upazila", value: v.upazila },
                { label: "Present Address", value: v.presentAddress },
                { label: "Permanent Address", value: v.permanentAddress },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium break-words">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">KYC Information</p>
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "Document Type", value: v.kycDocType },
                { label: "Document Number", value: v.kycDocNumber },
                { label: "KYC Status", value: v.kycStatus },
                { label: "Reviewed By", value: reviewerUser?.name },
                { label: "Reviewed On", value: v.kycReviewedAt?.toLocaleDateString("en-GB", { dateStyle: "medium" }) },
                { label: "Review Note", value: v.kycReviewNote },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium break-all">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {v.passportPhotoUrl && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Passport Photo</p>
              </div>
              <div className="p-4">
                <img src={v.passportPhotoUrl} alt="Passport photo" className="w-28 h-28 rounded-lg border object-cover" />
              </div>
            </div>
          )}
          {frontUrl && <DocViewer url={frontUrl.url} label="Front of Document" isPdf={frontUrl.isPdf} />}
          {!frontUrl && (
            <div className="border border-border/60 rounded-xl flex items-center justify-center h-32 bg-muted/10 text-muted-foreground text-sm">
              No front document uploaded
            </div>
          )}
          {backUrl && <DocViewer url={backUrl.url} label="Back of Document" isPdf={backUrl.isPdf} />}
          {!backUrl && (
            <div className="border border-border/60 rounded-xl flex items-center justify-center h-24 bg-muted/10 text-xs text-muted-foreground">
              No back document uploaded
            </div>
          )}
        </div>
      </div>

      <div className="border border-border/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Registered Beneficiaries ({registeredBeneficiaries.length})
          </p>
        </div>
        {registeredBeneficiaries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredBeneficiaries.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.type}</TableCell>
                    <TableCell>{b.district}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === "ACTIVE" ? "default" : b.status === "REJECTED" ? "destructive" : "secondary"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.createdAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/beneficiaries/${b.id}`} className="text-xs text-primary hover:underline underline-offset-2">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No beneficiaries registered by this volunteer yet.</p>
        )}
      </div>
    </div>
  )
}
