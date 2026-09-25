import { auditDb, auditLogs } from "@/db/audit"
import { db } from "@/db"
import { auditLogs as auditLogsMain } from "@/db/schema"
import { desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const actionColor = (action: string): "default" | "secondary" | "destructive" => {
  if (action.includes("APPROVED") || action.includes("CONFIRMED") || action.includes("DELIVERED")) return "default"
  if (action.includes("REJECTED") || action.includes("FAILED")) return "destructive"
  return "secondary"
}

export default async function AuditLogPage() {
  const logs = auditDb
    ? await auditDb.query.auditLogs.findMany({ orderBy: [desc(auditLogs.createdAt)], limit: 500 })
    : await db.query.auditLogs.findMany({ orderBy: [desc(auditLogsMain.createdAt)], limit: 500 })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every action taken in the system. Permanent and non-deleteable.
        </p>
      </div>

      <div className="rounded border border-border/40 bg-amber-50/50 border-amber-200 px-4 py-3 text-xs text-amber-700">
        This log is append-only. No entry can be deleted or modified. {logs.length} entries shown (latest 500).
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {entry.createdAt.toLocaleString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    timeZone: "Asia/Dhaka",
                  })}
                </TableCell>
                <TableCell className="text-sm font-medium">{entry.userName ?? "System"}</TableCell>
                <TableCell>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {entry.userRole ?? "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={actionColor(entry.action)} className="text-[10px] font-mono">
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {entry.resourceType && (
                    <span>{entry.resourceType}{entry.resourceId ? ` #${entry.resourceId}` : ""}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {entry.details ?? "-"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {entry.ipAddress ?? "-"}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No audit entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
