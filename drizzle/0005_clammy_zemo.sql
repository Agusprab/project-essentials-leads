ALTER TABLE "campaign_recipients" ADD COLUMN "queued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD COLUMN "last_attempt_at" timestamp with time zone;