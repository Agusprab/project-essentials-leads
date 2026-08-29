import { asc, isNotNull } from "drizzle-orm";

import { leads, scrapeJobs } from "@/db/schema";

export type LeadFilterOptions = {
  jobs: {
    id: string;
    name: string;
  }[];
  categories: string[];
};

const emptyOptions: LeadFilterOptions = {
  jobs: [],
  categories: [],
};

export async function getLeadFilterOptions(): Promise<LeadFilterOptions> {
  if (!process.env.DATABASE_URL) {
    return emptyOptions;
  }

  try {
    const { db } = await import("@/db");
    const [jobs, categoryRows] = await Promise.all([
      db
        .select({
          id: scrapeJobs.id,
          name: scrapeJobs.name,
        })
        .from(scrapeJobs)
        .orderBy(asc(scrapeJobs.name)),
      db
        .selectDistinct({
          category: leads.category,
        })
        .from(leads)
        .where(isNotNull(leads.category))
        .orderBy(asc(leads.category)),
    ]);

    return {
      jobs,
      categories: categoryRows.flatMap((row) =>
        row.category ? [row.category] : [],
      ),
    };
  } catch (error) {
    console.error("Gagal memuat opsi filter lead", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return emptyOptions;
  }
}
