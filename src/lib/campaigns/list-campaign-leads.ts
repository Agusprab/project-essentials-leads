import {
  and,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { campaignRecipients, leads } from "@/db/schema";

export type CampaignLeadFilters = {
  query?: string;
  scrapeJobId?: string;
  category?: string;
  location?: string;
  website?: "has" | "missing";
  campaignHistory?: "never" | "ever";
};

export type CampaignLeadCandidate = {
  id: string;
  businessName: string;
  category: string | null;
  address: string | null;
  phoneNormalized: string;
  websiteDomain: string | null;
  campaignCount: number;
  lastCampaignAt: string | null;
};

export type CampaignLeadCandidatesResult =
  | {
      state: "ready";
      candidates: CampaignLeadCandidate[];
      totalCount: number;
    }
  | {
      state: "missing-config" | "error";
      candidates: [];
      totalCount: 0;
    };

const candidateLimit = 100;

export async function listCampaignLeadCandidates(
  filters: CampaignLeadFilters,
): Promise<CampaignLeadCandidatesResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      candidates: [],
      totalCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const where = buildCampaignLeadWhere(filters);
    const rows = await db
      .select({
        id: leads.id,
        businessName: leads.businessName,
        category: leads.category,
        address: leads.address,
        phoneNormalized: leads.phoneNormalized,
        websiteDomain: leads.websiteDomain,
        campaignCount: sql<number>`count(${campaignRecipients.id})::int`,
        lastCampaignAt: sql<Date | string | null>`max(${campaignRecipients.createdAt})`,
      })
      .from(leads)
      .leftJoin(campaignRecipients, eq(campaignRecipients.leadId, leads.id))
      .where(where)
      .groupBy(
        leads.id,
        leads.businessName,
        leads.category,
        leads.address,
        leads.phoneNormalized,
        leads.websiteDomain,
        leads.createdAt,
      )
      .orderBy(desc(leads.createdAt))
      .limit(candidateLimit);

    return {
      state: "ready",
      candidates: rows.flatMap((row) =>
        row.phoneNormalized
          ? [
              {
                ...row,
                phoneNormalized: row.phoneNormalized,
                lastCampaignAt: serializeTimestamp(row.lastCampaignAt),
              },
            ]
          : [],
      ),
      totalCount: rows.length,
    };
  } catch (error) {
    console.error("Gagal memuat kandidat lead campaign", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      candidates: [],
      totalCount: 0,
    };
  }
}

function serializeTimestamp(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildCampaignLeadWhere(filters: CampaignLeadFilters): SQL | undefined {
  const conditions: SQL[] = [
    eq(leads.whatsappStatus, "eligible"),
    eq(leads.cleaningStatus, "clean"),
    isNotNull(leads.phoneNormalized),
  ];
  const query = filters.query?.trim();

  if (query) {
    conditions.push(
      or(
        ilike(leads.businessName, `%${query}%`),
        ilike(leads.category, `%${query}%`),
        ilike(leads.address, `%${query}%`),
        ilike(leads.websiteDomain, `%${query}%`),
      )!,
    );
  }

  if (filters.scrapeJobId) {
    conditions.push(eq(leads.scrapeJobId, filters.scrapeJobId));
  }

  if (filters.category) {
    conditions.push(eq(leads.category, filters.category));
  }

  if (filters.location?.trim()) {
    const location = `%${filters.location.trim()}%`;
    conditions.push(
      or(ilike(leads.address, location), ilike(leads.completeAddress, location))!,
    );
  }

  if (filters.website === "has") {
    conditions.push(isNotNull(leads.websiteDomain));
  }

  if (filters.website === "missing") {
    conditions.push(isNull(leads.websiteDomain));
  }

  if (filters.campaignHistory === "ever") {
    conditions.push(sql`${leads.id} in (
      select ${campaignRecipients.leadId}
      from ${campaignRecipients}
    )`);
  }

  if (filters.campaignHistory === "never") {
    conditions.push(sql`${leads.id} not in (
      select ${campaignRecipients.leadId}
      from ${campaignRecipients}
    )`);
  }

  return and(...conditions);
}

export function buildCampaignLeadFilterHref(filters: CampaignLeadFilters): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.scrapeJobId) params.set("job", filters.scrapeJobId);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.website) params.set("website", filters.website);
  if (filters.campaignHistory) params.set("campaignHistory", filters.campaignHistory);

  const query = params.toString();
  return query ? `/campaigns/new?${query}` : "/campaigns/new";
}
