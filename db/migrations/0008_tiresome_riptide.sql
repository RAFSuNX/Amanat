ALTER TABLE "beneficiary_members" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "beneficiary_members" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "beneficiary_members" ADD CONSTRAINT "beneficiary_members_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "special_need_applications" ADD CONSTRAINT "special_need_applications_sync_id_unique" UNIQUE("sync_id");