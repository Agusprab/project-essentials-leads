import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";

import { leads } from "@/db/schema";

export type LeadListItem = {
  id: string;
  businessName: string;
  category: string | null;
  address: string | null;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  phoneType: string | null;
  websiteDomain: string | null;
  reviewRating: number | null;
  cleaningStatus: string;
  whatsappStatus: string;
  duplicateReason: string | null;
  createdAt: Date;
};

export type LeadListResult =
  | {
      state: "ready";
      leads: LeadListItem[];
      totalCount: number;
      page: number;
      pageSize: number;
    }
  | {
      state: "missing-config" | "error";
      leads: [];
      totalCount: 0;
      page: number;
      pageSize: number;
    };

export type LeadListFilters = {
  query?: string;
  scrapeJobId?: string;
  category?: string;
  location?: string;
  phone?: "mobile" | "missing";
  website?: "has" | "missing";
  cleaningStatus?: "clean" | "incomplete" | "duplicate";
  whatsappStatus?: "eligible" | "ineligible" | "unchecked";
  page?: number;
};

const pageSize = 20;

export async function listLeads(
  filters: LeadListFilters,
): Promise<LeadListResult> {
  const page = Math.max(filters.page ?? 1, 1);

  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      leads: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }

  try {
    const { db } = await import("@/db");
    const where = buildWhere(filters);
    const offset = (page - 1) * pageSize;
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: leads.id,
          businessName: leads.businessName,
          category: leads.category,
          address: leads.address,
          phoneRaw: leads.phoneRaw,
          phoneNormalized: leads.phoneNormalized,
          phoneType: leads.phoneType,
          websiteDomain: leads.websiteDomain,
          reviewRating: leads.reviewRating,
          cleaningStatus: leads.cleaningStatus,
          whatsappStatus: leads.whatsappStatus,
          duplicateReason: leads.duplicateReason,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(where)
        .orderBy(desc(leads.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(leads).where(where),
    ]);

    return {
      state: "ready",
      leads: rows,
      totalCount: totalRows[0]?.value ?? 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Gagal memuat lead", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      leads: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }
}

function buildWhere(filters: LeadListFilters): SQL | undefined {
  const conditions: SQL[] = [];
  const query = filters.query?.trim();

  if (query) {
    conditions.push(
      or(
        ilike(leads.businessName, `%${query}%`),
        ilike(leads.category, `%${query}%`),
        ilike(leads.address, `%${query}%`),
        ilike(leads.phoneRaw, `%${query}%`),
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

  if (filters.phone === "mobile") {
    conditions.push(eq(leads.phoneType, "mobile"));
  }

  if (filters.phone === "missing") {
    conditions.push(or(isNull(leads.phoneRaw), eq(leads.phoneType, "unknown"))!);
  }

  if (filters.website === "has") {
    conditions.push(isNotNull(leads.websiteDomain));
  }

  if (filters.website === "missing") {
    conditions.push(isNull(leads.websiteDomain));
  }

  if (filters.cleaningStatus) {
    conditions.push(eq(leads.cleaningStatus, filters.cleaningStatus));
  }

  if (filters.whatsappStatus) {
    conditions.push(eq(leads.whatsappStatus, filters.whatsappStatus));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}
