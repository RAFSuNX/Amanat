import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

// This table lives in a SEPARATE audit database.
// It is append-only by design — no DELETE or UPDATE endpoints exist for it.
// At the database level, revoke DELETE/UPDATE from the app user for full tamper-resistance.
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  // Who
  userId: text("user_id"),
  userName: text("user_name"),   // denormalized — history survives user renames
  userRole: text("user_role"),
  // What
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: text("details"),      // JSON string
  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
