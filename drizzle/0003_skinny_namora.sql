CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"phone_normalized" text NOT NULL,
	"message_text" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"evolution_message_id" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"message_template" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipient_limit" integer DEFAULT 100 NOT NULL,
	"delay_ms" integer DEFAULT 1000 NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"pending_recipients" integer DEFAULT 0 NOT NULL,
	"sent_recipients" integer DEFAULT 0 NOT NULL,
	"failed_recipients" integer DEFAULT 0 NOT NULL,
	"approved_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_recipients_campaign_lead_unique" ON "campaign_recipients" USING btree ("campaign_id","lead_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_campaign_id_index" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_status_index" ON "campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_recipients_phone_normalized_index" ON "campaign_recipients" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "campaigns_status_index" ON "campaigns" USING btree ("status");