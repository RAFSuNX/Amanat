import { auditDb, auditLogs as auditLogsAuditDb } from "@/db/audit"
import { db } from "@/db"
import { auditLogs as auditLogsMainDb } from "@/db/schema"
import { NextRequest } from "next/server"

export type AuditAction =
  | "USER_LOGIN" | "USER_LOGOUT"
  | "DONATION_SUBMITTED" | "DONATION_CONFIRMED" | "DONATION_REJECTED"
  | "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED"
  | "VOLUNTEER_CREATED" | "VOLUNTEER_BECAME"
  | "BENEFICIARY_REGISTERED" | "BENEFICIARY_APPROVED" | "BENEFICIARY_REJECTED"
  | "DISTRIBUTION_CYCLE_CREATED" | "DISTRIBUTION_CALCULATED"
  | "DISTRIBUTION_REVIEW_CLOSED" | "DISTRIBUTION_ACTIVATED" | "DISTRIBUTION_COMPLETED"
  | "ALLOTMENT_FLAGGED" | "ALLOTMENT_REQUESTED" | "ALLOTMENT_OVERRIDDEN" | "ALLOTMENT_DELIVERED"
  | "APPLICATION_SUBMITTED" | "APPLICATION_APPROVED" | "APPLICATION_REJECTED"
  | "PHONE_UPDATED"

interface LogParams {
  userId?: string | null
  userName?: string | null
  userRole?: string | null
  action: AuditAction
  resourceType?: string
  resourceId?: string | number
  details?: Record<string, unknown>
  request?: NextRequest
}

export async function log(params: LogParams) {
  const entry = {
    userId: params.userId ?? null,
    userName: params.userName ?? null,
    userRole: params.userRole ?? null,
    action: params.action,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId != null ? String(params.resourceId) : null,
    details: params.details ? JSON.stringify(params.details) : null,
    ipAddress: params.request
      ? (params.request.headers.get("x-forwarded-for") ??
         params.request.headers.get("x-real-ip") ?? null)
      : null,
    userAgent: params.request
      ? params.request.headers.get("user-agent")?.slice(0, 200) ?? null
      : null,
  }

  try {
    if (auditDb) {
      // Preferred: separate isolated audit database
      await auditDb.insert(auditLogsAuditDb).values(entry)
    } else {
      // Fallback: main DB (still append-only, no delete endpoint)
      await db.insert(auditLogsMainDb).values(entry)
    }
  } catch {
    // Audit failure must never crash the main request
    console.error("[AUDIT] Failed to write log entry:", params.action)
  }
}
