import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as auditSchema from "./audit-schema"

// Separate audit database - isolated from production data.
// Falls back gracefully to null if AUDIT_DATABASE_URL is not configured.
let auditDb: ReturnType<typeof drizzle<typeof auditSchema>> | null = null

if (process.env.AUDIT_DATABASE_URL) {
  const client = postgres(process.env.AUDIT_DATABASE_URL, { max: 3 })
  auditDb = drizzle(client, { schema: auditSchema })
}

export { auditDb }
export { auditLogs } from "./audit-schema"
