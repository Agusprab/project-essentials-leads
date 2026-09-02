import { sql } from "drizzle-orm";

import { scrapeJobs } from "@/db/schema";

import type { GosomJob } from "./client";
import { listGosomJobs } from "./client";

export type SyncGosomJobsResult =
  | {
      state: "ready";
      syncedCount: number;
    }
  | {
      state: "missing-config" | "gosom-error" | "database-error";
      syncedCount: 0;
    };

export async function syncGosomJobs(): Promise<SyncGosomJobsResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      syncedCount: 0,
    };
  }

  const gosomResult = await listGosomJobs();

  if (gosomResult.state !== "ready") {
    return {
      state: "gosom-error",
      syncedCount: 0,
    };
  }

  if (gosomResult.jobs.length === 0) {
    return {
      state: "ready",
      syncedCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const now = new Date();

    for (const job of gosomResult.jobs) {
      const values = mapGosomJobToScrapeJob(job, now);

      await db
        .insert(scrapeJobs)
        .values(values)
        .onConflictDoUpdate({
          target: scrapeJobs.externalJobId,
          set: {
            name: values.name,
            keywords: values.keywords,
            language: values.language,
            latitude: values.latitude,
            longitude: values.longitude,
            zoom: values.zoom,
            radius: values.radius,
            depth: values.depth,
            fastMode: values.fastMode,
            extractEmail: values.extractEmail,
            extraReviews: values.extraReviews,
            maxTimeSeconds: values.maxTimeSeconds,
            status: sql`case
              when ${scrapeJobs.status} in ('imported', 'importing') then ${scrapeJobs.status}
              else ${values.status}
            end`,
            completedAt: sql`coalesce(${scrapeJobs.completedAt}, ${values.completedAt})`,
            lastSyncedAt: now,
            errorMessage: sql`case
              when ${scrapeJobs.status} = 'imported' then null
              else ${scrapeJobs.errorMessage}
            end`,
            updatedAt: now,
          },
        });
    }

    return {
      state: "ready",
      syncedCount: gosomResult.jobs.length,
    };
  } catch (error) {
    console.error("Gagal sinkronisasi job Gosom ke database", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      syncedCount: 0,
    };
  }
}

function mapGosomJobToScrapeJob(job: GosomJob, now: Date) {
  const completedAt = isCompletedStatus(job.Status) ? parseDate(job.Date) : null;

  return {
    provider: "google_maps",
    externalJobId: job.ID,
    name: job.Name,
    keywords: job.Data.keywords,
    language: job.Data.lang,
    latitude: job.Data.lat ?? null,
    longitude: job.Data.lon ?? null,
    zoom: job.Data.zoom,
    radius: job.Data.radius ?? null,
    depth: job.Data.depth,
    fastMode: job.Data.fast_mode,
    extractEmail: job.Data.email,
    extraReviews: job.Data.extra_reviews ?? false,
    maxTimeSeconds: normalizeMaxTime(job.Data.max_time),
    status: job.Status.toLowerCase(),
    completedAt,
    updatedAt: now,
  } satisfies typeof scrapeJobs.$inferInsert;
}

function isCompletedStatus(status: string): boolean {
  return ["ok", "success", "completed", "imported"].includes(status.toLowerCase());
}

function parseDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeMaxTime(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  if (!Number.isSafeInteger(value)) {
    return null;
  }

  return value;
}
