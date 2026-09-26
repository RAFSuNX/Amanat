import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { parseId } from "@/lib/http"
import Link from "next/link"
import { KycReviewForm } from "./form"
import { getPresignedUrl, isKey } from "@/lib/storage"

async function resolveDocUrl(value: string | null): Promise<string | null> {
  if (!value) return null
  // Legacy public URL — return as-is. New uploads store only the R2 key.
  if (!isKey(value)) return value
  return getPresignedUrl(value)
}

function DocViewer({ url, label }: { url: string; label: string }) {
  const isPdf = url.includes(".pdf") || url.includes("application%2Fpdf")
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline underline-offset-2">
          Open full size &rarr;
        </a>
      </div>
      {isPdf ? (
        <div className="flex items-center justify-center h-48 gap-3 flex-col">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline underline-offset-2 font-medium">
            View PDF Document
          </a>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="w-full object-contain max-h-[60vh]" />
        </a>
      )}
    </div>
  )
}

export default async function KycReviewPage({
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
      kycStatus: volunteerProfiles.kycStatus,
      kycDocType: volunteerProfiles.kycDocType,
      kycDocNumber: volunteerProfiles.kycDocNumber,
      kycDocImageUrl: volunteerProfiles.kycDocImageUrl,
      kycDocBackImageUrl: volunteerProfiles.kycDocBackImageUrl,
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
  if (v.kycStatus !== "PENDING") redirect("/admin/volunteers")

  // Resolve presigned URLs server-side — never sent to client as keys
  const [frontUrl, backUrl] = await Promise.all([
    resolveDocUrl(v.kycDocImageUrl),
    resolveDocUrl(v.kycDocBackImageUrl),
  ])

  const fields = [
    { label: "Full Name", value: v.name },
    { label: "Email", value: v.email },
    { label: "Phone", value: v.phone },
    { label: "District", value: v.district },
    { label: "Upazila", value: v.upazila },
    { label: "Present Address", value: v.presentAddress },
    { label: "Permanent Address", value: v.permanentAddress },
    { label: "Document Type", value: v.kycDocType },
    { label: "Document Number", value: v.kycDocNumber },
    { label: "Joined", value: v.joinedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) },
  ].filter((f) => f.value)

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/volunteers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Volunteers
        </Link>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">KYC Review</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{v.name}</h1>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left: volunteer info + decision */}
        <div className="flex flex-col gap-6">
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Volunteer Information</p>
            </div>
            <div className="divide-y divide-border/40">
              {fields.map((f) => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium break-all">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <KycReviewForm profileId={v.profileId} />
        </div>

        {/* Right: document images */}
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identity Documents</p>
          {frontUrl ? (
            <DocViewer url={frontUrl} label="Front of Document" />
          ) : (
            <div className="border border-border/60 rounded-xl flex items-center justify-center h-32 bg-muted/10 text-muted-foreground text-sm">
              No front document uploaded
            </div>
          )}
          {backUrl ? (
            <DocViewer url={backUrl} label="Back of Document" />
          ) : (
            <div className="border border-border/60 rounded-xl flex items-center justify-center h-32 bg-muted/10 text-xs text-muted-foreground">
              No back document uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
