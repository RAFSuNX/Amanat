import { db } from "@/db"
import { donations } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function maskRef(ref: string) {
  if (ref.length <= 6) return ref
  return ref.slice(0, 3) + "****" + ref.slice(-3)
}

export default async function LedgerDonationsPage() {
  const rows = await db.query.donations.findMany({
    where: eq(donations.status, "CONFIRMED"),
    orderBy: [desc(donations.confirmedAt)],
  })

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="font-semibold">Amanat</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">Public Ledger</span>
        <div className="ml-auto flex gap-3">
          <Link href="/ledger/donations">
            <Button variant="default" size="sm">Donations</Button>
          </Link>
          <Link href="/ledger/distributions">
            <Button variant="outline" size="sm">Distributions</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Donation Ledger</h1>
        <p className="text-sm text-muted-foreground mb-6">
          All confirmed donations are listed here. Donors may choose to remain anonymous.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Txn Ref</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {d.confirmedAt?.toLocaleDateString() ?? "—"}
                </TableCell>
                <TableCell>{d.isAnonymous ? "Anonymous" : d.donorName}</TableCell>
                <TableCell className="font-medium">
                  ৳{parseFloat(d.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{d.method}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {maskRef(d.transactionRef)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No confirmed donations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  )
}
