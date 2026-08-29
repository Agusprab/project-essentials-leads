import { and, count, eq, inArray, isNull, or } from "drizzle-orm";

import { leads, scrapeJobs } from "@/db/schema";

export type DashboardMetrics = {
  totalScrapeJobs: number;
  runningScrapeJobs: number;
  totalLeads: number;
  mobileLeads: number;
  duplicateOrIncompleteLeads: number;
  campaignReadyLeads: number;
};

export type DashboardOverviewResult = {
  state: "ready" | "missing-config" | "error";
  metrics: DashboardMetrics;
};

const emptyMetrics: DashboardMetrics = {
  totalScrapeJobs: 0,
  runningScrapeJobs: 0,
  totalLeads: 0,
  mobileLeads: 0,
  duplicateOrIncompleteLeads: 0,
  campaignReadyLeads: 0,
};

export async function getDashboardOverview(): Promise<DashboardOverviewResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      metrics: emptyMetrics,
    };
  }

  try {
    const { db } = await import("@/db");
    const [
      totalScrapeJobs,
      runningScrapeJobs,
      totalLeads,
      mobileLeads,
      duplicateOrIncompleteLeads,
      campaignReadyLeads,
    ] = await Promise.all([
      getCount(db.select({ value: count() }).from(scrapeJobs)),
      getCount(
        db
          .select({ value: count() })
          .from(scrapeJobs)
          .where(inArray(scrapeJobs.status, ["pending", "queued", "running"])),
      ),
      getCount(db.select({ value: count() }).from(leads)),
      getCount(
        db
          .select({ value: count() })
          .from(leads)
          .where(eq(leads.phoneType, "mobile")),
      ),
      getCount(
        db
          .select({ value: count() })
          .from(leads)
          .where(
            or(
              isNull(leads.phoneNormalized),
              eq(leads.cleaningStatus, "duplicate"),
              eq(leads.cleaningStatus, "incomplete"),
            ),
          ),
      ),
      getCount(
        db
          .select({ value: count() })
          .from(leads)
          .where(
            and(
              eq(leads.phoneType, "mobile"),
              inArray(leads.whatsappStatus, ["eligible", "ready"]),
            ),
          ),
      ),
    ]);

    return {
      state: "ready",
      metrics: {
        totalScrapeJobs,
        runningScrapeJobs,
        totalLeads,
        mobileLeads,
        duplicateOrIncompleteLeads,
        campaignReadyLeads,
      },
    };
  } catch (error) {
    console.error("Gagal memuat ringkasan dashboard", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      metrics: emptyMetrics,
    };
  }
}

async function getCount(query: Promise<Array<{ value: number }>>): Promise<number> {
  const rows = await query;
  return rows[0]?.value ?? 0;
}
