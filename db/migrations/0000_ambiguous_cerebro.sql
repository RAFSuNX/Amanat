CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('ACTIVE', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."beneficiary_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."beneficiary_type" AS ENUM('INDIVIDUAL', 'FAMILY');--> statement-breakpoint
CREATE TYPE "public"."cycle_status" AS ENUM('DRAFT', 'VOLUNTEER_REVIEW', 'ADMIN_REVIEW', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."donation_method" AS ENUM('BKASH', 'NAGAD', 'BANK', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('PENDING', 'CONFIRMED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."kyc_doc_type" AS ENUM('NID', 'PASSPORT', 'DRIVING_LICENSE');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'VOLUNTEER', 'DONOR');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_name" text,
	"user_role" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_by_volunteer_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"nid_number" text,
	"photo_url" text,
	"type" "beneficiary_type" NOT NULL,
	"division" text,
	"district" text NOT NULL,
	"upazila" text,
	"union_name" text,
	"village" text,
	"status" "beneficiary_status" DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"reviewed_by_admin_id" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficiary_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"name" text NOT NULL,
	"relation" text NOT NULL,
	"age" integer NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"is_earner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_allotments" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"requested_amount" numeric(12, 2) NOT NULL,
	"allocated_amount" numeric(12, 2),
	"weighted_score" numeric(14, 4),
	"is_flagged" boolean DEFAULT false NOT NULL,
	"volunteer_flag_note" text,
	"reviewed_by_volunteer_id" text,
	"manual_override_amount" numeric(12, 2),
	"override_by_admin_id" text,
	"delivered_by_volunteer_id" text,
	"delivery_status" "delivery_status" DEFAULT 'PENDING' NOT NULL,
	"delivery_note" text,
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "distribution_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"total_pool" numeric(14, 2) NOT NULL,
	"special_deduction_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"remaining_pool" numeric(14, 2),
	"status" "cycle_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_admin_id" text NOT NULL,
	"volunteer_review_deadline" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"completed_at" timestamp,
	CONSTRAINT "distribution_cycles_period_unique" UNIQUE("period")
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"donor_name" text NOT NULL,
	"donor_phone" text,
	"donor_email" text,
	"amount" numeric(12, 2) NOT NULL,
	"method" "donation_method" NOT NULL,
	"transaction_ref" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"receipt_image_url" text,
	"status" "donation_status" DEFAULT 'PENDING' NOT NULL,
	"confirmed_by_admin_id" text,
	"confirmed_at" timestamp,
	"rejection_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "need_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"assessed_by_volunteer_id" text NOT NULL,
	"period" text NOT NULL,
	"declared_monthly_need" numeric(12, 2) NOT NULL,
	"weighted_score" numeric(14, 4),
	"notes" text,
	"status" "assessment_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "special_need_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiary_id" integer NOT NULL,
	"submitted_by_volunteer_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"amount_requested" numeric(12, 2) NOT NULL,
	"status" "application_status" DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"approved_amount" numeric(12, 2),
	"reviewed_by_admin_id" text,
	"reviewed_at" timestamp,
	"cycle_id" integer,
	"delivery_status" "delivery_status" DEFAULT 'PENDING' NOT NULL,
	"delivery_note" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"image" text,
	"role" "role" DEFAULT 'DONOR' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"district" text NOT NULL,
	"upazila" text,
	"kyc_doc_type" "kyc_doc_type",
	"kyc_doc_number" text,
	"kyc_doc_image_url" text,
	"passport_photo_url" text,
	"kyc_status" "kyc_status" DEFAULT 'PENDING' NOT NULL,
	"kyc_review_note" text,
	"kyc_reviewed_at" timestamp,
	"kyc_reviewed_by_admin_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_registered_by_volunteer_id_users_id_fk" FOREIGN KEY ("registered_by_volunteer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_members" ADD CONSTRAINT "beneficiary_members_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_cycle_id_distribution_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."distribution_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_reviewed_by_volunteer_id_users_id_fk" FOREIGN KEY ("reviewed_by_volunteer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_override_by_admin_id_users_id_fk" FOREIGN KEY ("override_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_delivered_by_volunteer_id_users_id_fk" FOREIGN KEY ("delivered_by_volunteer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_cycles" ADD CONSTRAINT "distribution_cycles_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_confirmed_by_admin_id_users_id_fk" FOREIGN KEY ("confirmed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_assessments" ADD CONSTRAINT "need_assessments_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_assessments" ADD CONSTRAINT "need_assessments_assessed_by_volunteer_id_users_id_fk" FOREIGN KEY ("assessed_by_volunteer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD CONSTRAINT "special_need_applications_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD CONSTRAINT "special_need_applications_submitted_by_volunteer_id_users_id_fk" FOREIGN KEY ("submitted_by_volunteer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD CONSTRAINT "special_need_applications_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD CONSTRAINT "special_need_applications_cycle_id_distribution_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."distribution_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_kyc_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("kyc_reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;