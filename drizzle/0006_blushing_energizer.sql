ALTER TABLE "campaigns" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "media_file_name" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "media_mime_type" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "media_data" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "delay_mode" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "delay_min_ms" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "delay_max_ms" integer DEFAULT 1000 NOT NULL;