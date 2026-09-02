"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { scrapeJobs } from "@/db/schema";
import { importGosomJobLeads } from "@/lib/leads/import-gosom-csv";
import { deleteGosomJob } from "@/lib/gosom/client";
import { syncGosomJobs } from "@/lib/gosom/sync";
import {
  enqueueScrapingJob,
  removeScrapingQueueJob,
} from "@/lib/queue/scraping";

const importJobSchema = z.object({
  jobId: z.string().min(1).max(160),
});

const deleteJobSchema = z.object({
  scrapeJobId: z.string().uuid(),
});

const createJobFormSchema = z.object({
  name: z.string().trim().min(1).max(160),
  keywords: z.string().trim().min(1).max(500),
  lat: z.string().trim().min(1).max(40),
  lon: z.string().trim().min(1).max(40),
  lang: z.string().trim().min(2).max(12).default("id"),
  radius: z.coerce.number().int().min(100).max(100_000),
  depth: z.coerce.number().int().min(1).max(50),
  zoom: z.coerce.number().int().min(1).max(21),
  maxTimeMinutes: z.coerce.number().int().min(1).max(180),
  fastMode: z.string().optional(),
  email: z.string().optional(),
  extraReviews: z.string().optional(),
});

export async function syncGosomJobsAction() {
  const result = await syncGosomJobs();
  revalidatePath("/");
  revalidatePath("/scraping");

  redirect(`/scraping?sync=${result.state}&count=${result.syncedCount}`);
}

export async function createGosomJobAction(formData: FormData) {
  if (!process.env.DATABASE_URL || !process.env.REDIS_URL) {
    redirect("/scraping?create=missing-config");
  }

  const parsed = createJobFormSchema.safeParse({
    name: formData.get("name"),
    keywords: formData.get("keywords"),
    lat: formData.get("lat"),
    lon: formData.get("lon"),
    lang: formData.get("lang") ?? "id",
    radius: formData.get("radius"),
    depth: formData.get("depth"),
    zoom: formData.get("zoom"),
    maxTimeMinutes: formData.get("maxTimeMinutes"),
    fastMode: formData.get("fastMode") ?? undefined,
    email: formData.get("email") ?? undefined,
    extraReviews: formData.get("extraReviews") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/scraping?create=invalid");
  }

  const values = parsed.data;
  const now = new Date();
  const keywords = values.keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (keywords.length === 0) {
    redirect("/scraping?create=invalid");
  }

  try {
    const { db } = await import("@/db");
    const [createdJob] = await db
      .insert(scrapeJobs)
      .values({
        provider: "google_maps",
        externalJobId: null,
        name: values.name,
        keywords,
        language: values.lang,
        latitude: values.lat,
        longitude: values.lon,
        zoom: values.zoom,
        radius: values.radius,
        depth: values.depth,
        fastMode: values.fastMode === "on",
        extractEmail: values.email === "on",
        extraReviews: values.extraReviews === "on",
        maxTimeSeconds: values.maxTimeMinutes * 60,
        status: "queued",
        queuedAt: now,
        updatedAt: now,
      })
      .returning({
        id: scrapeJobs.id,
      });

    if (!createdJob) {
      throw new Error("scrape_job_not_created");
    }

    await enqueueScrapingJob(createdJob.id);
  } catch (error) {
    console.error("Gagal memasukkan job scraping ke antrean", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    redirect("/scraping?create=error");
  }

  revalidatePath("/");
  revalidatePath("/scraping");
  redirect("/scraping?create=queued");
}

export async function importGosomJobAction(formData: FormData) {
  const parsed = importJobSchema.safeParse({
    jobId: formData.get("jobId"),
  });

  if (!parsed.success) {
    redirect("/scraping?import=invalid-job");
  }

  const result = await importGosomJobLeads(parsed.data.jobId);
  revalidatePath("/");
  revalidatePath("/scraping");
  revalidatePath("/leads");

  redirect(
    `/scraping?import=${result.state}&count=${result.importedCount}`,
  );
}

export async function deleteGosomJobAction(formData: FormData) {
  const parsed = deleteJobSchema.safeParse({
    scrapeJobId: formData.get("scrapeJobId"),
  });

  if (!parsed.success) {
    redirect("/scraping?delete=invalid-job");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/scraping?delete=missing-config");
  }

  let deleteState: "ready" | "not-found" | "error" = "ready";

  try {
    const { db } = await import("@/db");
    const [job] = await db
      .select({
        id: scrapeJobs.id,
        externalJobId: scrapeJobs.externalJobId,
        status: scrapeJobs.status,
      })
      .from(scrapeJobs)
      .where(eq(scrapeJobs.id, parsed.data.scrapeJobId))
      .limit(1);

    if (!job) {
      deleteState = "not-found";
    } else {
      if (process.env.REDIS_URL) {
        await removeScrapingQueueJob(job.id);
      }

      if (job.externalJobId) {
        const result = await deleteGosomJob(job.externalJobId);

        if (result.state === "error") {
          deleteState = "error";
        }
      }

      if (deleteState !== "error") {
        await db.delete(scrapeJobs).where(eq(scrapeJobs.id, job.id));
      }
    }
  } catch (error) {
    console.error("Gagal menghapus job scraping", {
      scrapeJobId: parsed.data.scrapeJobId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    deleteState = "error";
  }

  revalidatePath("/");
  revalidatePath("/scraping");
  revalidatePath("/leads");
  redirect(`/scraping?delete=${deleteState}`);
}
