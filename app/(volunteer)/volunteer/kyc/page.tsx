import { getSession } from "@/lib/session"
import { db } from "@/db"
import { volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { KycForm } from "./kyc-form"

export default async function VolunteerKycPage() {
  const session = await getSession()
  if (!session) return null

  const profile = await db.query.volunteerProfiles.findFirst({
    where: eq(volunteerProfiles.userId, session.user.id),
  })

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold">KYC Verification</h1>

      {profile && (
        <div className="rounded-lg border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Status</span>
          <Badge
            variant={
              profile.kycStatus === "APPROVED"
                ? "default"
                : profile.kycStatus === "REJECTED"
                ? "destructive"
                : "secondary"
            }
          >
            {profile.kycStatus}
          </Badge>
        </div>
      )}

      {profile?.kycReviewNote && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium">Admin note:</p>
          <p className="mt-1 text-muted-foreground">{profile.kycReviewNote}</p>
        </div>
      )}

      {profile?.kycStatus === "APPROVED" ? (
        <p className="text-sm text-muted-foreground">
          Your KYC has been approved. You are fully verified.
        </p>
      ) : (
        <KycForm
          profileId={profile?.id}
          existing={
            profile
              ? {
                  docType: profile.kycDocType ?? undefined,
                  docNumber: profile.kycDocNumber ?? undefined,
                  docImageUrl: profile.kycDocImageUrl ?? undefined,
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
