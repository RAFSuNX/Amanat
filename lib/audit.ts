import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { NextRequest } from "next/server"

export type AuditAction =
  // Auth
  | "USER_LOGIN"
  | "USER_LOGOUT"
  // Donations
  | "DONATION_SUBMITTED"
  | "DONATION_CONFIRMED"
  | "DONATION_REJECTED"
  // KYC
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  // Volunteers
  | "VOLUNTEER_CREATED"
  | "VOLUNTEER_BECAME"
  // Beneficiaries
  | "BENEFICIARY_REGISTERED"
  | "BENEFICIARY_APPROVED"
  | "BENEFICIARY_REJECTED"
  // Distributions
  | "DISTRIBUTION_CYCLE_CREATED"
  | "DISTRIBUTION_CALCULATED"
  | "DISTRIBUTION_ACTIVATED"
  | "DISTRIBUTION_COMPLETED"
  | "ALLOTMENT_FLAGGED"
  | "ALLOTMENT_DELIVERED"
  // Special needs
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  // Account
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
  try {
    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      userRole: params.userRole ?? null,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId != null ? String(params.resourceId) : null,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress: params.request
        ? (params.request.headers.get("x-forwarded-for") ?? params.request.headers.get("x-real-ip") ?? null)
        : null,
      userAgent: params.request
        ? params.request.headers.get("user-agent")?.slice(0, 200) ?? null
        : null,
    })
  } catch {
    // Audit log failure must never crash the main request
    console.error("[AUDIT] Failed to write log entry:", params.action)
  }
}
