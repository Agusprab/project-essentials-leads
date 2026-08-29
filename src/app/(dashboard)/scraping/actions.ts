"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { importGosomJobLeads } from "@/lib/leads/import-gosom-csv";
import { createGosomJob, deleteGosomJob } from "@/lib/gosom/client";
import { syncGosomJobs } from "@/lib/gosom/sync";
import { scrapeJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

const importJobSchema = z.object({
  jobId: z.string().min(1).max(160),
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
  const result = await createGosomJob({
    name: values.name,
    keywords: values.keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    lang: values.lang,
    lat: values.lat,
    lon: values.lon,
    zoom: values.zoom,
    radius: values.radius,
    depth: values.depth,
    fast_mode: values.fastMode === "on",
    email: values.email === "on",
    extra_reviews: values.extraReviews === "on",
    max_time: values.maxTimeMinutes * 60,
  });

  if (result.state === "ready") {
    await syncGosomJobs();
  }

  revalidatePath("/");
  revalidatePath("/scraping");
  redirect(`/scraping?create=${result.state}`);
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
  const parsed = importJobSchema.safeParse({
    jobId: formData.get("jobId"),
  });

  if (!parsed.success) {
    redirect("/scraping?delete=invalid-job");
  }

  const result = await deleteGosomJob(parsed.data.jobId);

  if (process.env.DATABASE_URL && result.state !== "error") {
    const { db } = await import("@/db");
    await db
      .delete(scrapeJobs)
      .where(eq(scrapeJobs.externalJobId, parsed.data.jobId));
  }

  revalidatePath("/");
  revalidatePath("/scraping");
  revalidatePath("/leads");
  redirect(`/scraping?delete=${result.state}`);
}
