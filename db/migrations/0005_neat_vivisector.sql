ALTER TABLE "beneficiaries" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "distribution_cycles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "distribution_cycles" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "need_assessments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "need_assessments" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD COLUMN "sync_id" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "distribution_allotments" ADD CONSTRAINT "distribution_allotments_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "distribution_cycles" ADD CONSTRAINT "distribution_cycles_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "need_assessments" ADD CONSTRAINT "need_assessments_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_sync_id_unique" UNIQUE("sync_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  PERFORM pg_notify('ledger_sync', TG_TABLE_NAME);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_users BEFORE INSERT OR UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_volunteer_profiles BEFORE INSERT OR UPDATE ON "volunteer_profiles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_beneficiaries BEFORE INSERT OR UPDATE ON "beneficiaries" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_need_assessments BEFORE INSERT OR UPDATE ON "need_assessments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_distribution_cycles BEFORE INSERT OR UPDATE ON "distribution_cycles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_distribution_allotments BEFORE INSERT OR UPDATE ON "distribution_allotments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_ledger_sync_donations BEFORE INSERT OR UPDATE ON "donations" FOR EACH ROW EXECUTE FUNCTION set_updated_at();