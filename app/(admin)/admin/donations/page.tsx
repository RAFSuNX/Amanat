import { db } from "@/db"
import { donations } from "@/db/schema"
import { desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DonationActions } from "./donation-actions"

export default async function AdminDonationsPage() {
  const rows = await db.query.donations.findMany({
    orderBy: [desc(donations.createdAt)],
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Donations</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Txn Ref</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                  {d.donorPhone && (
                    <p className="text-xs text-muted-foreground">{d.donorPhone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">৳{parseFloat(d.amount).toLocaleString()}</TableCell>
              <TableCell>{d.method}</TableCell>
              <TableCell className="font-mono text-sm">{d.transactionRef}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {d.createdAt.toLocaleDateString()}
              </TableCell>
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
              <TableCell>
                {d.status === "PENDING" && (
                  <DonationActions donationId={d.id} />
                )}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No donations yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
