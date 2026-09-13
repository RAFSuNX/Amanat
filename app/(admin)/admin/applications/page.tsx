import { db } from "@/db"
import { specialNeedApplications, beneficiaries, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ApplicationActions } from "./application-actions"

const statusVariant = (s: string) =>
  s === "APPROVED" ? "default" : s === "REJECTED" ? "destructive" : "secondary"

export default async function AdminApplicationsPage() {
  const rows = await db
    .select({
      id: specialNeedApplications.id,
      title: specialNeedApplications.title,
      description: specialNeedApplications.description,
      amountRequested: specialNeedApplications.amountRequested,
      approvedAmount: specialNeedApplications.approvedAmount,
      status: specialNeedApplications.status,
      deliveryStatus: specialNeedApplications.deliveryStatus,
      adminNote: specialNeedApplications.adminNote,
      createdAt: specialNeedApplications.createdAt,
      beneficiaryName: beneficiaries.name,
      volunteerName: users.name,
    })
    .from(specialNeedApplications)
    .leftJoin(beneficiaries, eq(specialNeedApplications.beneficiaryId, beneficiaries.id))
    .leftJoin(users, eq(specialNeedApplications.submittedByVolunteerId, users.id))
    .orderBy(desc(specialNeedApplications.createdAt))

  const pending = rows.filter(r => r.status === "PENDING")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Special Need Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Emergency fund requests from volunteers for families with urgent needs.
          {pending.length > 0 && <span className="text-amber-600 font-medium"> {pending.length} pending review.</span>}
        </p>
      </div>

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Beneficiary</TableHead>
            <TableHead>Volunteer</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className={r.status === "PENDING" ? "bg-amber-50/30" : ""}>
              <TableCell className="font-medium">{r.beneficiaryName ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.volunteerName ?? "—"}</TableCell>
              <TableCell className="max-w-xs">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.description}</p>
              </TableCell>
              <TableCell className="tabular-nums">{parseFloat(r.amountRequested).toLocaleString()} BDT</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {r.approvedAmount ? `${parseFloat(r.approvedAmount).toLocaleString()} BDT` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell>
                {r.status === "PENDING" && <ApplicationActions id={r.id} />}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                No special need applications yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
