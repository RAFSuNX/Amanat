import {
  pgTable,
  text,
  integer,
  boolean,
  decimal,
  timestamp,
  pgEnum,
  serial,
  uuid,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["ADMIN", "VOLUNTEER", "DONOR"])

export const kycStatusEnum = pgEnum("kyc_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
])

export const kycDocTypeEnum = pgEnum("kyc_doc_type", [
  "NID",
  "PASSPORT",
  "DRIVING_LICENSE",
])

export const beneficiaryStatusEnum = pgEnum("beneficiary_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "INACTIVE",
])

export const beneficiaryTypeEnum = pgEnum("beneficiary_type", [
  "INDIVIDUAL",
  "FAMILY",
])

export const donationMethodEnum = pgEnum("donation_method", [
  "BKASH",
  "NAGAD",
  "BANK",
  "OTHER",
])

export const donationStatusEnum = pgEnum("donation_status", [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
])

export const cycleStatusEnum = pgEnum("cycle_status", [
  "DRAFT",
  "VOLUNTEER_REVIEW",
  "ADMIN_REVIEW",
  "ACTIVE",
  "COMPLETED",
])

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "DELIVERED",
  "FAILED",
])

export const applicationStatusEnum = pgEnum("application_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
])

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "ACTIVE",
  "SUPERSEDED",
])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  image: text("image"),
  role: roleEnum("role").notNull().default("DONOR"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Better Auth required tables
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// ─── Volunteer Profile ─────────────────────────────────────────────────────────

export const volunteerProfiles = pgTable("volunteer_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  district: text("district").notNull(),
  upazila: text("upazila"),
  kycDocType: kycDocTypeEnum("kyc_doc_type"),
  kycDocNumber: text("kyc_doc_number"),
  kycDocImageUrl: text("kyc_doc_image_url"),
  passportPhotoUrl: text("passport_photo_url"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("PENDING"),
  kycReviewNote: text("kyc_review_note"),
  kycReviewedAt: timestamp("kyc_reviewed_at"),
  kycReviewedByAdminId: text("kyc_reviewed_by_admin_id").references(
    () => users.id
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Beneficiaries ─────────────────────────────────────────────────────────────

export const beneficiaries = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  registeredByVolunteerId: text("registered_by_volunteer_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone"),
  nidNumber: text("nid_number"),
  photoUrl: text("photo_url"),
  type: beneficiaryTypeEnum("type").notNull(),
  // Address
  division: text("division"),
  district: text("district").notNull(),
  upazila: text("upazila"),
  union: text("union_name"),
  village: text("village"),
  // Status
  status: beneficiaryStatusEnum("status").notNull().default("PENDING"),
  adminNote: text("admin_note"),
  reviewedByAdminId: text("reviewed_by_admin_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const beneficiaryMembers = pgTable("beneficiary_members", {
  id: serial("id").primaryKey(),
  beneficiaryId: integer("beneficiary_id")
    .notNull()
    .references(() => beneficiaries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relation: text("relation").notNull(), // self, spouse, child, parent, etc.
  age: integer("age").notNull(),
  isDisabled: boolean("is_disabled").notNull().default(false),
  isEarner: boolean("is_earner").notNull().default(false),
  // isChild (age < 12) and isElderly (age >= 60) are computed in app logic
})

// ─── Need Assessments ──────────────────────────────────────────────────────────

export const needAssessments = pgTable("need_assessments", {
  id: serial("id").primaryKey(),
  beneficiaryId: integer("beneficiary_id")
    .notNull()
    .references(() => beneficiaries.id, { onDelete: "cascade" }),
  assessedByVolunteerId: text("assessed_by_volunteer_id")
    .notNull()
    .references(() => users.id),
  period: text("period").notNull(), // "YYYY-MM" format
  declaredMonthlyNeed: decimal("declared_monthly_need", {
    precision: 12,
    scale: 2,
  }).notNull(),
  weightedScore: decimal("weighted_score", { precision: 14, scale: 4 }),
  notes: text("notes"),
  status: assessmentStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Donations ─────────────────────────────────────────────────────────────────

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id), // null for guest donations
  donorName: text("donor_name").notNull(),
  donorPhone: text("donor_phone"),
  donorEmail: text("donor_email"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: donationMethodEnum("method").notNull(),
  transactionRef: text("transaction_ref").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  receiptImageUrl: text("receipt_image_url"),
  status: donationStatusEnum("status").notNull().default("PENDING"),
  confirmedByAdminId: text("confirmed_by_admin_id").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  rejectionNote: text("rejection_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Distribution Cycles ────────────────────────────────────────────────────────

export const distributionCycles = pgTable("distribution_cycles", {
  id: serial("id").primaryKey(),
  period: text("period").notNull().unique(), // "YYYY-MM"
  totalPool: decimal("total_pool", { precision: 14, scale: 2 }).notNull(),
  specialDeductionTotal: decimal("special_deduction_total", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  remainingPool: decimal("remaining_pool", { precision: 14, scale: 2 }),
  status: cycleStatusEnum("status").notNull().default("DRAFT"),
  createdByAdminId: text("created_by_admin_id")
    .notNull()
    .references(() => users.id),
  volunteerReviewDeadline: timestamp("volunteer_review_deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  activatedAt: timestamp("activated_at"),
  completedAt: timestamp("completed_at"),
})

// ─── Distribution Allotments ───────────────────────────────────────────────────

export const distributionAllotments = pgTable("distribution_allotments", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id")
    .notNull()
    .references(() => distributionCycles.id, { onDelete: "cascade" }),
  beneficiaryId: integer("beneficiary_id")
    .notNull()
    .references(() => beneficiaries.id),
  requestedAmount: decimal("requested_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 12, scale: 2 }),
  weightedScore: decimal("weighted_score", { precision: 14, scale: 4 }),
  // Volunteer review / adjustment request
  isFlagged: boolean("is_flagged").notNull().default(false),
  volunteerFlagNote: text("volunteer_flag_note"),
  volunteerRequestedAmount: decimal("volunteer_requested_amount", {
    precision: 12,
    scale: 2,
  }),
  volunteerReceiptUrl: text("volunteer_receipt_url"),
  reviewedByVolunteerId: text("reviewed_by_volunteer_id").references(
    () => users.id
  ),
  // Admin override
  manualOverrideAmount: decimal("manual_override_amount", {
    precision: 12,
    scale: 2,
  }),
  overrideByAdminId: text("override_by_admin_id").references(() => users.id),
  // Delivery
  deliveredByVolunteerId: text("delivered_by_volunteer_id").references(
    () => users.id
  ),
  deliveryStatus: deliveryStatusEnum("delivery_status")
    .notNull()
    .default("PENDING"),
  deliveryNote: text("delivery_note"),
  deliveredAt: timestamp("delivered_at"),
})

// ─── Special Need Applications ──────────────────────────────────────────────────

export const specialNeedApplications = pgTable("special_need_applications", {
  id: serial("id").primaryKey(),
  beneficiaryId: integer("beneficiary_id")
    .notNull()
    .references(() => beneficiaries.id),
  submittedByVolunteerId: text("submitted_by_volunteer_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amountRequested: decimal("amount_requested", {
    precision: 12,
    scale: 2,
  }).notNull(),
  status: applicationStatusEnum("status").notNull().default("PENDING"),
  adminNote: text("admin_note"),
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  reviewedByAdminId: text("reviewed_by_admin_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  cycleId: integer("cycle_id").references(() => distributionCycles.id),
  deliveryStatus: deliveryStatusEnum("delivery_status")
    .notNull()
    .default("PENDING"),
  deliveryNote: text("delivery_note"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Audit Logs (append-only, never deleted) ──────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  // Who
  userId: text("user_id"),            // nullable: system actions
  userName: text("user_name"),        // denormalized so renaming doesn't erase history
  userRole: text("user_role"),
  // What
  action: text("action").notNull(),   // e.g. DONATION_CONFIRMED, KYC_APPROVED
  resourceType: text("resource_type"), // donation | beneficiary | volunteer | distribution | application
  resourceId: text("resource_id"),
  details: text("details"),           // JSON string with contextual data
  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  volunteerProfile: one(volunteerProfiles, {
    fields: [users.id],
    references: [volunteerProfiles.userId],
  }),
  donations: many(donations),
  registeredBeneficiaries: many(beneficiaries),
  submittedApplications: many(specialNeedApplications),
}))

export const beneficiariesRelations = relations(
  beneficiaries,
  ({ one, many }) => ({
    registeredBy: one(users, {
      fields: [beneficiaries.registeredByVolunteerId],
      references: [users.id],
    }),
    members: many(beneficiaryMembers),
    needAssessments: many(needAssessments),
    allotments: many(distributionAllotments),
    applications: many(specialNeedApplications),
  })
)

export const distributionCyclesRelations = relations(
  distributionCycles,
  ({ many }) => ({
    allotments: many(distributionAllotments),
    specialApplications: many(specialNeedApplications),
  })
)

// Inverse ("one") relations — required for drizzle's relational queries
// (e.g. beneficiaries.findMany({ with: { members, needAssessments } }) in
// calculateDistribution) to infer the join keys.
export const beneficiaryMembersRelations = relations(beneficiaryMembers, ({ one }) => ({
  beneficiary: one(beneficiaries, {
    fields: [beneficiaryMembers.beneficiaryId],
    references: [beneficiaries.id],
  }),
}))

export const needAssessmentsRelations = relations(needAssessments, ({ one }) => ({
  beneficiary: one(beneficiaries, {
    fields: [needAssessments.beneficiaryId],
    references: [beneficiaries.id],
  }),
}))

export const distributionAllotmentsRelations = relations(distributionAllotments, ({ one }) => ({
  cycle: one(distributionCycles, {
    fields: [distributionAllotments.cycleId],
    references: [distributionCycles.id],
  }),
  beneficiary: one(beneficiaries, {
    fields: [distributionAllotments.beneficiaryId],
    references: [beneficiaries.id],
  }),
}))

export const specialNeedApplicationsRelations = relations(specialNeedApplications, ({ one }) => ({
  beneficiary: one(beneficiaries, {
    fields: [specialNeedApplications.beneficiaryId],
    references: [beneficiaries.id],
  }),
  submittedBy: one(users, {
    fields: [specialNeedApplications.submittedByVolunteerId],
    references: [users.id],
  }),
}))
