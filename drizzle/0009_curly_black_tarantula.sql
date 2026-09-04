DROP INDEX "leads_source_place_id_unique";--> statement-breakpoint
CREATE INDEX "leads_source_place_id_index" ON "leads" USING btree ("source","place_id");