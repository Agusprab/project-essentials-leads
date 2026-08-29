CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrape_job_id" uuid NOT NULL,
	"source" text DEFAULT 'google_maps' NOT NULL,
	"input_id" text,
	"place_id" text,
	"cid" text,
	"maps_url" text,
	"business_name" text NOT NULL,
	"category" text,
	"address" text,
	"complete_address" text,
	"website" text,
	"website_domain" text,
	"phone_raw" text,
	"phone_normalized" text,
	"phone_type" text,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_count" integer,
	"review_rating" double precision,
	"latitude" double precision,
	"longitude" double precision,
	"thumbnail_url" text,
	"maps_status" text,
	"cleaning_status" text DEFAULT 'raw' NOT NULL,
	"whatsapp_status" text DEFAULT 'unchecked' NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'google_maps' NOT NULL,
	"external_job_id" text NOT NULL,
	"name" text NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" text DEFAULT 'id' NOT NULL,
	"latitude" text,
	"longitude" text,
	"zoom" integer DEFAULT 15 NOT NULL,
	"radius" integer,
	"depth" integer DEFAULT 1 NOT NULL,
	"fast_mode" boolean DEFAULT false NOT NULL,
	"extract_email" boolean DEFAULT false NOT NULL,
	"extra_reviews" boolean DEFAULT false NOT NULL,
	"max_time_seconds" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_scrape_job_id_scrape_jobs_id_fk" FOREIGN KEY ("scrape_job_id") REFERENCES "public"."scrape_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_source_place_id_unique" ON "leads" USING btree ("source","place_id");--> statement-breakpoint
CREATE INDEX "leads_scrape_job_id_index" ON "leads" USING btree ("scrape_job_id");--> statement-breakpoint
CREATE INDEX "leads_phone_normalized_index" ON "leads" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "leads_website_domain_index" ON "leads" USING btree ("website_domain");--> statement-breakpoint
CREATE INDEX "leads_cleaning_status_index" ON "leads" USING btree ("cleaning_status");--> statement-breakpoint
CREATE INDEX "leads_whatsapp_status_index" ON "leads" USING btree ("whatsapp_status");--> statement-breakpoint
CREATE UNIQUE INDEX "scrape_jobs_external_job_id_unique" ON "scrape_jobs" USING btree ("external_job_id");--> statement-breakpoint
CREATE INDEX "scrape_jobs_status_index" ON "scrape_jobs" USING btree ("status");