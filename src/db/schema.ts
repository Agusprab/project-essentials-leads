import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const scrapeJobs = pgTable(
  "scrape_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    provider: text("provider")
      .notNull()
      .default("google_maps"),

    externalJobId: text("external_job_id"),

    name: text("name")
      .notNull(),

    keywords: jsonb("keywords")
      .$type<string[]>()
      .notNull()
      .default([]),

    language: text("language")
      .notNull()
      .default("id"),

    latitude: text("latitude"),
    longitude: text("longitude"),

    zoom: integer("zoom")
      .notNull()
      .default(15),

    radius: integer("radius"),
    depth: integer("depth")
      .notNull()
      .default(1),

    fastMode: boolean("fast_mode")
      .notNull()
      .default(false),

    extractEmail: boolean("extract_email")
      .notNull()
      .default(false),

    extraReviews: boolean("extra_reviews")
      .notNull()
      .default(false),

    maxTimeSeconds: bigint("max_time_seconds", {
      mode: "number",
    }),

    status: text("status")
      .notNull()
      .default("queued"),

    resultCount: integer("result_count")
      .notNull()
      .default(0),

    errorMessage: text("error_message"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    importedAt: timestamp("imported_at", {
      withTimezone: true,
    }),

    queuedAt: timestamp("queued_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: true,
    }),

    attemptCount: integer("attempt_count")
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("scrape_jobs_external_job_id_unique")
      .on(table.externalJobId),

    index("scrape_jobs_status_index")
      .on(table.status),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    scrapeJobId: uuid("scrape_job_id")
      .notNull()
      .references(() => scrapeJobs.id, {
        onDelete: "cascade",
      }),

    source: text("source")
      .notNull()
      .default("google_maps"),
    sourceRowKey: text("source_row_key")
      .notNull(),
    duplicateOfLeadId: uuid("duplicate_of_lead_id"),
    duplicateReason: text("duplicate_reason"),

    inputId: text("input_id"),
    placeId: text("place_id"),
    cid: text("cid"),

    mapsUrl: text("maps_url"),

    businessName: text("business_name")
      .notNull(),

    category: text("category"),

    address: text("address"),
    completeAddress: text("complete_address"),

    website: text("website"),
    websiteDomain: text("website_domain"),

    phoneRaw: text("phone_raw"),
    phoneNormalized: text("phone_normalized"),
    phoneType: text("phone_type"),

    emails: jsonb("emails")
      .$type<string[]>()
      .notNull()
      .default([]),

    reviewCount: integer("review_count"),

    reviewRating: doublePrecision("review_rating"),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    thumbnailUrl: text("thumbnail_url"),

    mapsStatus: text("maps_status"),

    cleaningStatus: text("cleaning_status")
      .notNull()
      .default("raw"),

    whatsappStatus: text("whatsapp_status")
      .notNull()
      .default("unchecked"),

    rawData: jsonb("raw_data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("leads_source_place_id_unique")
      .on(table.source, table.placeId),
    uniqueIndex("leads_job_source_row_key_unique")
      .on(table.scrapeJobId, table.sourceRowKey),

    index("leads_scrape_job_id_index")
      .on(table.scrapeJobId),

    index("leads_phone_normalized_index")
      .on(table.phoneNormalized),

    index("leads_website_domain_index")
      .on(table.websiteDomain),

    index("leads_cleaning_status_index")
      .on(table.cleaningStatus),

    index("leads_whatsapp_status_index")
      .on(table.whatsappStatus),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name")
      .notNull(),

    messageTemplate: text("message_template")
      .notNull(),

    mediaType: text("media_type"),
    mediaFileName: text("media_file_name"),
    mediaMimeType: text("media_mime_type"),
    mediaData: text("media_data"),

    status: text("status")
      .notNull()
      .default("draft"),

    recipientLimit: integer("recipient_limit")
      .notNull()
      .default(100),

    delayMs: integer("delay_ms")
      .notNull()
      .default(1000),

    delayMode: text("delay_mode")
      .notNull()
      .default("fixed"),

    delayMinMs: integer("delay_min_ms")
      .notNull()
      .default(1000),

    delayMaxMs: integer("delay_max_ms")
      .notNull()
      .default(1000),

    totalRecipients: integer("total_recipients")
      .notNull()
      .default(0),

    pendingRecipients: integer("pending_recipients")
      .notNull()
      .default(0),

    sentRecipients: integer("sent_recipients")
      .notNull()
      .default(0),

    failedRecipients: integer("failed_recipients")
      .notNull()
      .default(0),

    approvedAt: timestamp("approved_at", {
      withTimezone: true,
    }),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("campaigns_status_index")
      .on(table.status),
  ],
);

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, {
        onDelete: "cascade",
      }),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, {
        onDelete: "cascade",
      }),

    phoneNormalized: text("phone_normalized")
      .notNull(),

    messageText: text("message_text")
      .notNull(),

    status: text("status")
      .notNull()
      .default("pending"),

    evolutionMessageId: text("evolution_message_id"),
    errorMessage: text("error_message"),

    attemptCount: integer("attempt_count")
      .notNull()
      .default(0),

    sentAt: timestamp("sent_at", {
      withTimezone: true,
    }),

    queuedAt: timestamp("queued_at", {
      withTimezone: true,
    }),

    lastAttemptAt: timestamp("last_attempt_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("campaign_recipients_campaign_lead_unique")
      .on(table.campaignId, table.leadId),

    index("campaign_recipients_campaign_id_index")
      .on(table.campaignId),

    index("campaign_recipients_status_index")
      .on(table.status),

    index("campaign_recipients_phone_normalized_index")
      .on(table.phoneNormalized),
  ],
);
