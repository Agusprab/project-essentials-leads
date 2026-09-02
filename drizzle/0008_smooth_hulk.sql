ALTER TABLE "scrape_jobs" ALTER COLUMN "external_job_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ALTER COLUMN "status" SET DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD COLUMN "queued_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;