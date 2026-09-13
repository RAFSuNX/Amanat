import { db } from "@/db"
import { distributionCycles, distributionAllotments } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const statusVariant = (s: string) => {
  if (s === "COMPLETED") return "default"
  if (s === "ACTIVE") return "default"
  if (s === "VOLUNTEER_REVIEW" || s === "ADMIN_REVIEW") return "secondary"
  return "secondary"
}

export default async function AdminDistributionsPage() {
  const cycles = await db.query.distributionCycles.findMany({
    orderBy: [desc(distributionCycles.createdAt)],
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
          <p className="text-sm text-muted-foreground mt-1">Monthly fund distribution cycles</p>
        </div>
        <Link href="/admin/distributions/new">
          <Button>New Cycle</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {cycles.map(c => (
          <div key={c.id} className="border border-border/40 rounded-lg p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <p className="font-semibold">{c.period}</p>
                <Badge variant={statusVariant(c.status)}>{c.status.replace(/_/g, " ")}</Badge>
              </div>
              <div className="flex gap-6 text-xs text-muted-foreground mt-1">
                <span>Pool: {parseFloat(c.totalPool).toLocaleString()} BDT</span>
                {c.remainingPool && <span>Remaining: {parseFloat(c.remainingPool).toLocaleString()} BDT</span>}
                {c.notes && <span>{c.notes}</span>}
              </div>
            </div>
            <Link href={`/admin/distributions/${c.id}`}>
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </div>
        ))}
        {cycles.length === 0 && (
          <div className="border border-border/40 rounded-lg p-12 text-center text-muted-foreground text-sm">
            No distribution cycles yet.{" "}
            <Link href="/admin/distributions/new" className="underline">Create the first one</Link>
          </div>
        )}
      </div>
    </div>
  )
}
