import { getSession } from "@/lib/session"
import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PhoneForm } from "@/app/account/phone-form"
import { Badge } from "@/components/ui/badge"

export default async function VolunteerProfilePage() {
  const session = await getSession()
  if (!session) return null

  const [userRow] = await db
    .select({ name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, session.user.id))

  const profile = await db.query.volunteerProfiles.findFirst({
    where: eq(volunteerProfiles.userId, session.user.id),
  })

  return (
    <div className="max-w-lg flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal details. Phone number is used to pre-fill donation forms.
        </p>
      </div>

      {/* Identity */}
      <div className="flex flex-col divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden">
        {[
          { label: "Full Name", value: userRow?.name },
          { label: "Email", value: userRow?.email },
          { label: "District", value: profile?.district },
          { label: "Upazila", value: profile?.upazila ?? "Not set" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{row.label}</span>
            <span className="text-sm font-medium">{row.value ?? "Not set"}</span>
          </div>
        ))}
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">KYC Status</span>
          <Badge variant={
            profile?.kycStatus === "APPROVED" ? "default"
            : profile?.kycStatus === "REJECTED" ? "destructive"
            : "secondary"
          }>
            {profile?.kycStatus ?? "Not submitted"}
          </Badge>
        </div>
      </div>

      {/* Editable phone */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Mobile Number</p>
        <p className="text-xs text-muted-foreground">
          Used to pre-fill donation forms and for contact purposes.
        </p>
        <PhoneForm current={userRow?.phone ?? null} />
      </div>
    </div>
  )
}
