import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { donations, users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "@/components/sign-out-button"
import { PhoneForm } from "./phone-form"

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const role = (session.user as { role?: string }).role

  if (role === "ADMIN") redirect("/admin")
  if (role === "VOLUNTEER") redirect("/volunteer")

  const [userRow] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, session.user.id))

  const [totals] = await db
    .select({
      totalDonated: sql<string>`coalesce(sum(amount) filter (where status = 'CONFIRMED'), 0)`,
      pendingCount: sql<number>`count(*) filter (where status = 'PENDING')`,
      confirmedCount: sql<number>`count(*) filter (where status = 'CONFIRMED')`,
    })
    .from(donations)
    .where(eq(donations.userId, session.user.id))

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold">Amanat</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <SignOutButton />
        </div>
      </nav>

      <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold">{session.user.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{session.user.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Donated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {parseFloat(totals?.totalDonated ?? "0").toLocaleString()} BDT
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number(totals?.confirmedCount ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number(totals?.pendingCount ?? 0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center py-3 border-t border-border/40 justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
              <p className="text-sm">{session.user.email}</p>
            </div>
          </div>
          <PhoneForm current={userRow?.phone ?? null} />
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/account/donations">
            <Button variant="outline" className="w-full justify-start">
              View donation history
            </Button>
          </Link>
          <Link href="/donate">
            <Button className="w-full justify-start">
              Make a donation
            </Button>
          </Link>
          <Link href="/ledger/donations" className="text-sm text-muted-foreground hover:underline text-center">
            View public ledger
          </Link>
        </div>
      </main>
    </div>
  )
}
