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
