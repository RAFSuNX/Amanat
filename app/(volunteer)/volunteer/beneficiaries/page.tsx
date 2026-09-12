import { getSession } from "@/lib/session"
import { db } from "@/db"
import { beneficiaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

export default async function MyBeneficiariesPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db.query.beneficiaries.findMany({
    where: eq(beneficiaries.registeredByVolunteerId, session.user.id),
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Beneficiaries</h1>
        <Link href="/volunteer/beneficiaries/new">
          <Button>Register New</Button>
        </Link>
      </div>

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
          {rows.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.name}</TableCell>
              <TableCell>{b.type}</TableCell>
              <TableCell>{b.district}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    b.status === "ACTIVE" ? "default"
                    : b.status === "REJECTED" ? "destructive"
                    : "secondary"
                  }
                >
                  {b.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {b.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Link href={`/volunteer/beneficiaries/${b.id}`} className="text-sm underline">
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No beneficiaries registered yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
