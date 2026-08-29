import { and, eq, or } from "drizzle-orm";

import { parseCsv } from "@/lib/csv/parse";
import { cleanGosomLeadRow, type CleanedLead } from "@/lib/cleaning/lead-cleaning";
import { leads, scrapeJobs } from "@/db/schema";
import { downloadGosomJobCsv } from "@/lib/gosom/client";

export type ImportGosomJobResult =
  | {
      state: "ready";
      importedCount: number;
    }
  | {
      state:
        | "missing-config"
        | "job-not-found"
        | "download-not-found"
        | "download-error"
        | "database-error";
      importedCount: 0;
    };

export async function importGosomJobLeads(
  externalJobId: string,
): Promise<ImportGosomJobResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      importedCount: 0,
    };
  }

  const download = await downloadGosomJobCsv(externalJobId);

  if (download.state === "missing-config" || download.state === "error") {
    return {
      state: "download-error",
      importedCount: 0,
    };
  }

  if (download.state === "not-found") {
    return {
      state: "download-not-found",
      importedCount: 0,
    };
  }

  if (download.state !== "ready") {
    return {
      state: "download-error",
      importedCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const [job] = await db
      .select({ id: scrapeJobs.id })
      .from(scrapeJobs)
      .where(eq(scrapeJobs.externalJobId, externalJobId))
      .limit(1);

    if (!job) {
      return {
        state: "job-not-found",
        importedCount: 0,
      };
    }

    const cleanedRows = parseCsv(download.csv).map(cleanGosomLeadRow);
    const now = new Date();

    await db.transaction(async (tx) => {
      for (const cleanedLead of cleanedRows) {
        const duplicate = await findDuplicateLead(tx, cleanedLead);
        const values = {
          scrapeJobId: job.id,
          ...mapCleanedLeadToInsert(cleanedLead, duplicate),
          updatedAt: now,
        };

        await tx
          .insert(leads)
          .values(values)
          .onConflictDoUpdate({
            target: [leads.scrapeJobId, leads.sourceRowKey],
            set: {
              inputId: values.inputId,
              placeId: values.placeId,
              cid: values.cid,
              mapsUrl: values.mapsUrl,
              businessName: values.businessName,
              category: values.category,
              address: values.address,
              completeAddress: values.completeAddress,
              website: values.website,
              websiteDomain: values.websiteDomain,
              phoneRaw: values.phoneRaw,
              phoneNormalized: values.phoneNormalized,
              phoneType: values.phoneType,
              emails: values.emails,
              reviewCount: values.reviewCount,
              reviewRating: values.reviewRating,
              latitude: values.latitude,
              longitude: values.longitude,
              thumbnailUrl: values.thumbnailUrl,
              mapsStatus: values.mapsStatus,
              cleaningStatus: values.cleaningStatus,
              whatsappStatus: values.whatsappStatus,
              duplicateOfLeadId: values.duplicateOfLeadId,
              duplicateReason: values.duplicateReason,
              rawData: values.rawData,
              updatedAt: now,
            },
          });
      }

      await tx
        .update(scrapeJobs)
        .set({
          resultCount: cleanedRows.length,
          importedAt: now,
          status: "imported",
          updatedAt: now,
        })
        .where(eq(scrapeJobs.id, job.id));
    });

    return {
      state: "ready",
      importedCount: cleanedRows.length,
    };
  } catch (error) {
    console.error("Gagal impor CSV Gosom", {
      externalJobId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      importedCount: 0,
    };
  }
}

function mapCleanedLeadToInsert(
  lead: CleanedLead,
  duplicate: { id: string; reason: string } | null,
) {
  const isDuplicate = Boolean(duplicate);

  return {
    source: "google_maps",
    sourceRowKey: lead.sourceRowKey,
    duplicateOfLeadId: duplicate?.id ?? null,
    duplicateReason: duplicate?.reason ?? null,
    inputId: lead.inputId,
    placeId: lead.placeId,
    cid: lead.cid,
    mapsUrl: lead.mapsUrl,
    businessName: lead.businessName,
    category: lead.category,
    address: lead.address,
    completeAddress: lead.completeAddress,
    website: lead.website,
    websiteDomain: lead.websiteDomain,
    phoneRaw: lead.phoneRaw,
    phoneNormalized: lead.phoneNormalized,
    phoneType: lead.phoneType,
    emails: lead.emails,
    reviewCount: lead.reviewCount,
    reviewRating: lead.reviewRating,
    latitude: lead.latitude,
    longitude: lead.longitude,
    thumbnailUrl: lead.thumbnailUrl,
    mapsStatus: lead.mapsStatus,
    cleaningStatus: isDuplicate ? "duplicate" : lead.cleaningStatus,
    whatsappStatus: isDuplicate ? "ineligible" : lead.whatsappStatus,
    rawData: lead.rawData,
  } satisfies Omit<typeof leads.$inferInsert, "scrapeJobId">;
}

async function findDuplicateLead(
  tx: Parameters<Parameters<typeof import("@/db").db.transaction>[0]>[0],
  lead: CleanedLead,
): Promise<{ id: string; reason: string } | null> {
  const conditions = [
    lead.placeId
      ? and(eq(leads.source, "google_maps"), eq(leads.placeId, lead.placeId))
      : undefined,
    lead.cid ? eq(leads.cid, lead.cid) : undefined,
    lead.phoneNormalized
      ? eq(leads.phoneNormalized, lead.phoneNormalized)
      : undefined,
    lead.websiteDomain ? eq(leads.websiteDomain, lead.websiteDomain) : undefined,
    lead.businessName && lead.address
      ? and(eq(leads.businessName, lead.businessName), eq(leads.address, lead.address))
      : undefined,
  ].filter((condition) => condition !== undefined);

  if (conditions.length === 0) {
    return null;
  }

  const [duplicate] = await tx
    .select({
      id: leads.id,
      placeId: leads.placeId,
      cid: leads.cid,
      phoneNormalized: leads.phoneNormalized,
      websiteDomain: leads.websiteDomain,
      businessName: leads.businessName,
      address: leads.address,
    })
    .from(leads)
    .where(or(...conditions))
    .limit(1);

  if (!duplicate) {
    return null;
  }

  return {
    id: duplicate.id,
    reason: getDuplicateReason(duplicate, lead),
  };
}

function getDuplicateReason(
  duplicate: {
    placeId: string | null;
    cid: string | null;
    phoneNormalized: string | null;
    websiteDomain: string | null;
    businessName: string;
    address: string | null;
  },
  lead: CleanedLead,
): string {
  if (lead.placeId && duplicate.placeId === lead.placeId) {
    return "place_id";
  }

  if (lead.cid && duplicate.cid === lead.cid) {
    return "cid";
  }

  if (
    lead.phoneNormalized &&
    duplicate.phoneNormalized === lead.phoneNormalized
  ) {
    return "phone";
  }

  if (lead.websiteDomain && duplicate.websiteDomain === lead.websiteDomain) {
    return "website_domain";
  }

  return "business_name_address";
}
