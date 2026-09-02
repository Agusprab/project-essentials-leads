import { desc } from "drizzle-orm";

import { scrapeJobs } from "@/db/schema";

export type ScrapingJobListItem = {
  id: string;
  externalJobId: string | null;
  name: string;
  keywords: string[];
  date: Date;
  status: string;
  radius: number | null;
  resultCount: number;
  errorMessage: string | null;
};

export type ListScrapingJobsResult =
  | {
      state: "ready";
      jobs: ScrapingJobListItem[];
    }
  | {
      state: "missing-config" | "error";
      jobs: [];
    };

export async function listScrapingJobs(): Promise<ListScrapingJobsResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      jobs: [],
    };
  }

  try {
    const { db } = await import("@/db");
    const jobs = await db
      .select({
        id: scrapeJobs.id,
        externalJobId: scrapeJobs.externalJobId,
        name: scrapeJobs.name,
        keywords: scrapeJobs.keywords,
        date: scrapeJobs.createdAt,
        status: scrapeJobs.status,
        radius: scrapeJobs.radius,
        resultCount: scrapeJobs.resultCount,
        errorMessage: scrapeJobs.errorMessage,
      })
      .from(scrapeJobs)
      .orderBy(desc(scrapeJobs.createdAt));

    return {
      state: "ready",
      jobs,
    };
  } catch (error) {
    console.error("Gagal memuat job scraping lokal", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      jobs: [],
    };
  }
}
