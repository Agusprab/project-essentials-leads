ALTER TABLE "leads" ADD COLUMN "source_row_key" text;--> statement-breakpoint
UPDATE "leads"
SET "source_row_key" = lower(concat_ws('|', coalesce("place_id", ''), coalesce("cid", ''), coalesce("input_id", ''), coalesce("maps_url", ''), "business_name", coalesce("address", ''), "id"::text))
WHERE "source_row_key" IS NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source_row_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "duplicate_of_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "duplicate_reason" text;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_job_source_row_key_unique" ON "leads" USING btree ("scrape_job_id","source_row_key");
