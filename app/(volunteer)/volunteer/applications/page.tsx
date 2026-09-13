import { getSession } from "@/lib/session"
import { db } from "@/db"
import { specialNeedApplications, beneficiaries } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const statusVariant = (s: string) => {
  if (s === "APPROVED") return "default"
  if (s === "REJECTED") return "destructive"
  return "secondary"
}

export default async function ApplicationsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select({
      id: specialNeedApplications.id,
      title: specialNeedApplications.title,
      amountRequested: specialNeedApplications.amountRequested,
      approvedAmount: specialNeedApplications.approvedAmount,
      status: specialNeedApplications.status,
      deliveryStatus: specialNeedApplications.deliveryStatus,
      createdAt: specialNeedApplications.createdAt,
      beneficiaryName: beneficiaries.name,
    })
    .from(specialNeedApplications)
    .innerJoin(beneficiaries, eq(specialNeedApplications.beneficiaryId, beneficiaries.id))
    .where(eq(specialNeedApplications.submittedByVolunteerId, session.user.id))
    .orderBy(desc(specialNeedApplications.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Special Need Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Emergency or one-off requests outside the regular distribution cycle.
          </p>
        </div>
        <Link href="/volunteer/applications/new">
          <Button>New Application</Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Beneficiary</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.beneficiaryName}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell className="tabular-nums">{parseFloat(r.amountRequested).toLocaleString()} BDT</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {r.approvedAmount ? `${parseFloat(r.approvedAmount).toLocaleString()} BDT` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={r.deliveryStatus === "DELIVERED" ? "default" : "secondary"}>
                  {r.deliveryStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                No applications yet.{" "}
                <Link href="/volunteer/applications/new" className="underline">Submit one</Link> for a beneficiary with an emergency need.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
