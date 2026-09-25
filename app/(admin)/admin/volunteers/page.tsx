import { db } from "@/db"
import { users, volunteerProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { KycActions } from "./kyc-actions"

export default async function AdminVolunteersPage() {
  const volunteers = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      district: volunteerProfiles.district,
      upazila: volunteerProfiles.upazila,
      kycStatus: volunteerProfiles.kycStatus,
      kycDocType: volunteerProfiles.kycDocType,
      kycDocNumber: volunteerProfiles.kycDocNumber,
      kycDocImageUrl: volunteerProfiles.kycDocImageUrl,
      profileId: volunteerProfiles.id,
    })
    .from(users)
    .leftJoin(volunteerProfiles, eq(users.id, volunteerProfiles.userId))
    .where(eq(users.role, "VOLUNTEER"))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Volunteers</h1>
        <Link href="/admin/volunteers/new">
          <Button>Add Volunteer</Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>District</TableHead>
            <TableHead>KYC Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {volunteers.map((v) => (
            <TableRow key={v.userId}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell className="text-sm">{v.email}</TableCell>
              <TableCell className="text-sm">{v.district ?? "Not set"}</TableCell>
              <TableCell>
                {v.kycStatus ? (
                  <Badge
                    variant={
                      v.kycStatus === "APPROVED"
                        ? "default"
                        : v.kycStatus === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {v.kycStatus}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">No KYC yet</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {v.createdAt.toLocaleDateString()}
              </TableCell>
              <TableCell>
                {v.kycStatus === "PENDING" && v.profileId && (
                  <KycActions
                    profileId={v.profileId}
                    volunteer={{
                      name: v.name,
                      email: v.email,
                      phone: v.phone,
                      district: v.district,
                      upazila: v.upazila,
                      docType: v.kycDocType,
                      docNumber: v.kycDocNumber,
                      docImageUrl: v.kycDocImageUrl,
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
          {volunteers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No volunteers yet.{" "}
                <Link href="/admin/volunteers/new" className="underline">
                  Add the first one
                </Link>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
