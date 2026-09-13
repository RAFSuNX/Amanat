import { getSession } from "@/lib/session"
import { db } from "@/db"
import { beneficiaries, distributionAllotments } from "@/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VolunteerDashboard() {
  const session = await getSession()
  if (!session) return null

  const [myBeneficiaries] = await db
    .select({ count: sql<number>`count(*)` })
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.registeredByVolunteerId, session.user.id),
        eq(beneficiaries.status, "ACTIVE")
      )
    )

  const activeCycle = await db.query.distributionCycles.findFirst({
    where: (c, { inArray }) =>
      inArray(c.status, ["VOLUNTEER_REVIEW", "ACTIVE"]),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })

  let pendingDeliveries = 0
  if (activeCycle) {
    const [pd] = await db
      .select({ count: sql<number>`count(*)` })
      .from(distributionAllotments)
      .where(
        and(
          eq(distributionAllotments.cycleId, activeCycle.id),
          eq(distributionAllotments.deliveryStatus, "PENDING"),
          eq(distributionAllotments.deliveredByVolunteerId, session.user.id)
        )
      )
    pendingDeliveries = Number(pd?.count ?? 0)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
        <Link href="/volunteer/beneficiaries/new">
          <Button>Register Beneficiary</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Active Beneficiaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Number(myBeneficiaries?.count ?? 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingDeliveries}</p>
            {pendingDeliveries > 0 && (
              <Link href="/volunteer/deliveries" className="text-xs underline mt-1 block">
                View deliveries →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donation section */}
      <div className="border border-border/40 rounded p-5 flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Make a donation</p>
          <p className="text-xs text-muted-foreground">
            Volunteers can donate too. Your details will be pre-filled.
          </p>
        </div>
        <Link href="/donate" className="shrink-0">
          <Button variant="outline">Donate</Button>
        </Link>
      </div>

      {activeCycle?.status === "VOLUNTEER_REVIEW" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-sm">Review Required</p>
          <p className="text-sm text-muted-foreground mt-1">
            The {activeCycle.period} distribution cycle is open for volunteer review.
            Please check your beneficiaries&apos; allotments.
          </p>
          <Link href="/volunteer/deliveries">
            <Button size="sm" className="mt-3">Review Allotments</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
