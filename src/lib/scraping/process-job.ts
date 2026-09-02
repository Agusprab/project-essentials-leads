import { eq } from "drizzle-orm";

import { db } from "@/db";
import { scrapeJobs } from "@/db/schema";
import {
  createGosomJob,
  getGosomJob,
  listGosomJobs,
  type CreateGosomJobInput,
  type GosomJob,
} from "@/lib/gosom/client";
import {
  isCompletedGosomStatus,
  isFailedGosomStatus,
} from "@/lib/gosom/status";

export type ProcessScrapingJobResult =
  | {
      state: "ready" | "skipped";
    }
  | {
      state: "missing-config" | "job-not-found" | "submit-error" | "poll-error";
    };

const defaultPollingIntervalMs = 60_000;
const defaultMaxRuntimeMs = 3 * 60 * 60 * 1000;

export async function processScrapingJob(
  scrapeJobId: string,
): Promise<ProcessScrapingJobResult> {
  if (!process.env.GOSOM_API_URL) {
    await markFailed(scrapeJobId, "GOSOM_API_URL belum dikonfigurasi");
    return {
      state: "missing-config",
    };
  }

  const [job] = await db
    .select()
    .from(scrapeJobs)
    .where(eq(scrapeJobs.id, scrapeJobId))
    .limit(1);

  if (!job) {
    return {
      state: "job-not-found",
    };
  }

  if (["cancelled", "imported"].includes(job.status)) {
    return {
      state: "skipped",
    };
  }

  let externalJobId = job.externalJobId;

  if (!externalJobId) {
    const submitted = await submitQueuedJob(job);

    if (submitted.state !== "ready") {
      return {
        state: "submit-error",
      };
    }

    externalJobId = submitted.externalJobId;
  }

  return await pollUntilFinished(scrapeJobId, externalJobId, job.maxTimeSeconds);
}

async function submitQueuedJob(
  job: typeof scrapeJobs.$inferSelect,
): Promise<
  | {
      state: "ready";
      externalJobId: string;
    }
  | {
      state: "error";
    }
> {
  const now = new Date();

  await db
    .update(scrapeJobs)
    .set({
      status: "submitting",
      startedAt: job.startedAt ?? now,
      attemptCount: job.attemptCount + 1,
      errorMessage: null,
      updatedAt: now,
    })
    .where(eq(scrapeJobs.id, job.id));

  const input = mapScrapeJobToGosomInput(job);
  const result = await createGosomJob(input);

  if (result.state !== "ready") {
    await markFailed(job.id, "Job belum bisa dikirim ke Gosom API");
    return {
      state: "error",
    };
  }

  const externalJobId =
    result.jobId ?? (await findRecentlyCreatedExternalJobId(input));

  if (!externalJobId) {
    await markFailed(job.id, "Gosom API tidak mengembalikan ID job baru");
    return {
      state: "error",
    };
  }

  await db
    .update(scrapeJobs)
    .set({
      externalJobId,
      status: result.job?.Status.toLowerCase() ?? "running",
      submittedAt: now,
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(scrapeJobs.id, job.id));

  return {
    state: "ready",
    externalJobId,
  };
}

async function pollUntilFinished(
  scrapeJobId: string,
  externalJobId: string,
  maxTimeSeconds: number | null,
): Promise<ProcessScrapingJobResult> {
  const startedAt = Date.now();
  const timeoutMs = getMaxRuntimeMs(maxTimeSeconds);

  while (Date.now() - startedAt < timeoutMs) {
    const result = await getGosomJob(externalJobId);

    if (result.state !== "ready") {
      await markFailed(scrapeJobId, "Status job belum bisa dibaca dari Gosom API");
      return {
        state: "poll-error",
      };
    }

    await syncLocalJob(scrapeJobId, result.job);

    if (isCompletedGosomStatus(result.job.Status)) {
      return {
        state: "ready",
      };
    }

    if (isFailedGosomStatus(result.job.Status)) {
      await markFailed(scrapeJobId, `Gosom mengembalikan status ${result.job.Status}`);
      return {
        state: "ready",
      };
    }

    await sleep(getPollingIntervalMs());
  }

  await markFailed(scrapeJobId, "Job melewati batas waktu polling");

  return {
    state: "poll-error",
  };
}

async function syncLocalJob(scrapeJobId: string, job: GosomJob): Promise<void> {
  const now = new Date();
  const completedAt = isCompletedGosomStatus(job.Status) ? parseDate(job.Date) ?? now : null;

  await db
    .update(scrapeJobs)
    .set({
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
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(scrapeJobs.id, scrapeJobId));
}

async function findRecentlyCreatedExternalJobId(
  input: CreateGosomJobInput,
): Promise<string | null> {
  const result = await listGosomJobs();

  if (result.state !== "ready") {
    return null;
  }

  const matchingJobs = result.jobs
    .filter((job) => {
      return (
        job.Name === input.name &&
        job.Data.lat === input.lat &&
        job.Data.lon === input.lon &&
        job.Data.keywords.join("\u0000") === input.keywords.join("\u0000")
      );
    })
    .sort((a, b) => {
      const left = parseDate(a.Date)?.getTime() ?? 0;
      const right = parseDate(b.Date)?.getTime() ?? 0;

      return right - left;
    });

  return matchingJobs[0]?.ID ?? null;
}

function mapScrapeJobToGosomInput(
  job: typeof scrapeJobs.$inferSelect,
): CreateGosomJobInput {
  return {
    name: job.name,
    keywords: job.keywords,
    lang: job.language,
    lat: job.latitude ?? "0",
    lon: job.longitude ?? "0",
    zoom: job.zoom,
    radius: job.radius ?? 10_000,
    depth: job.depth,
    fast_mode: job.fastMode,
    email: job.extractEmail,
    extra_reviews: job.extraReviews,
    max_time: job.maxTimeSeconds ?? 180,
  };
}

async function markFailed(scrapeJobId: string, errorMessage: string): Promise<void> {
  const now = new Date();

  await db
    .update(scrapeJobs)
    .set({
      status: "failed",
      errorMessage,
      updatedAt: now,
    })
    .where(eq(scrapeJobs.id, scrapeJobId));
}

function getPollingIntervalMs(): number {
  const value = Number(process.env.SCRAPING_POLL_INTERVAL_MS);

  if (Number.isSafeInteger(value) && value >= 5_000) {
    return value;
  }

  return defaultPollingIntervalMs;
}

function getMaxRuntimeMs(maxTimeSeconds: number | null): number {
  const gosomMaxTimeMs = typeof maxTimeSeconds === "number" ? maxTimeSeconds * 1000 : 0;

  return Math.max(defaultMaxRuntimeMs, gosomMaxTimeMs + 30 * 60 * 1000);
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

function parseDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
