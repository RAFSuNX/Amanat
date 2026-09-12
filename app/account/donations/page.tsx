import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { donations } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/sign-out-button"

export default async function AccountDonationsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const rows = await db.query.donations.findMany({
    where: eq(donations.userId, session.user.id),
    orderBy: [desc(donations.createdAt)],
  })

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold">Amanat</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <Link href="/donate">
            <Button size="sm">Donate Again</Button>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">My Donations</h1>
        <p className="text-sm text-muted-foreground mb-8">
          All donations tied to your account. Pending donations are awaiting admin confirmation.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Txn Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anonymous</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {d.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {parseFloat(d.amount).toLocaleString()} BDT
                </TableCell>
                <TableCell>{d.method}</TableCell>
                <TableCell className="font-mono text-sm">{d.transactionRef}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      d.status === "CONFIRMED"
                        ? "default"
                        : d.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {d.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.isAnonymous ? "Yes" : "No"}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No donations yet.{" "}
                  <Link href="/donate" className="underline">
                    Make your first donation
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  )
}
