// Read-only connection to the remote public ledger database.
// This DB is kept in sync via PostgreSQL logical replication from the primary.
// Falls back to the local primary if REMOTE_PUBLIC_LEDGER_DATABASE_URL is not configured.

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

let remoteDb: ReturnType<typeof drizzle<typeof schema>> | null = null

if (process.env.REMOTE_PUBLIC_LEDGER_DATABASE_URL) {
  const client = postgres(process.env.REMOTE_PUBLIC_LEDGER_DATABASE_URL, {
    max: 5,
    // This is a read-only replica - never write to it directly
  })
  remoteDb = drizzle(client, { schema })
}

// Use remote DB for public ledger reads, fall back to local if not configured
export { remoteDb }

import { db } from "./index"
export const ledgerDb = remoteDb ?? db
