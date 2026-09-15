import { db } from "@/db"
import { beneficiaries, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BeneficiaryActions } from "./beneficiary-actions"

export default async function AdminBeneficiariesPage() {
  const rows = await db
    .select({
      id: beneficiaries.id,
      name: beneficiaries.name,
      type: beneficiaries.type,
      district: beneficiaries.district,
      status: beneficiaries.status,
      adminNote: beneficiaries.adminNote,
      createdAt: beneficiaries.createdAt,
      volunteerName: users.name,
    })
    .from(beneficiaries)
    .leftJoin(users, eq(beneficiaries.registeredByVolunteerId, users.id))
    .orderBy(desc(beneficiaries.createdAt))

  const pending = rows.filter(r => r.status === "PENDING")
  const rest = rows.filter(r => r.status !== "PENDING")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beneficiaries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} pending review · {rows.filter(r => r.status === "ACTIVE").length} active
        </p>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Pending Review</p>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.district}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.volunteerName ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell><BeneficiaryActions id={r.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">All Records</p>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Volunteer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rest.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.district}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.volunteerName ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "ACTIVE" ? "default" : r.status === "REJECTED" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.createdAt.toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}
