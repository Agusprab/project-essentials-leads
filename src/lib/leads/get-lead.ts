import { desc, eq } from "drizzle-orm";

import { campaignRecipients, campaigns, leads, scrapeJobs } from "@/db/schema";

export type LeadDetailResult =
  | {
      state: "ready";
      lead: {
        id: string;
        scrapeJobName: string | null;
        businessName: string;
        category: string | null;
        address: string | null;
        completeAddress: string | null;
        mapsUrl: string | null;
        website: string | null;
        websiteDomain: string | null;
        phoneRaw: string | null;
        phoneNormalized: string | null;
        phoneType: string | null;
        emails: string[];
        reviewCount: number | null;
        reviewRating: number | null;
        latitude: number | null;
        longitude: number | null;
        mapsStatus: string | null;
        cleaningStatus: string;
        whatsappStatus: string;
        duplicateReason: string | null;
        duplicateOfLeadId: string | null;
        placeId: string | null;
        cid: string | null;
        sourceRowKey: string;
        rawData: Record<string, unknown>;
        createdAt: Date;
        updatedAt: Date;
        campaignHistory: {
          campaignId: string;
          campaignName: string;
          campaignStatus: string;
          recipientStatus: string;
          attemptCount: number;
          errorMessage: string | null;
          sentAt: Date | null;
          createdAt: Date;
        }[];
      };
    }
  | {
      state: "missing-config" | "not-found" | "error";
      lead: null;
    };

export async function getLead(id: string): Promise<LeadDetailResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      lead: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const [lead] = await db
      .select({
        id: leads.id,
        scrapeJobName: scrapeJobs.name,
        businessName: leads.businessName,
        category: leads.category,
        address: leads.address,
        completeAddress: leads.completeAddress,
        mapsUrl: leads.mapsUrl,
        website: leads.website,
        websiteDomain: leads.websiteDomain,
        phoneRaw: leads.phoneRaw,
        phoneNormalized: leads.phoneNormalized,
        phoneType: leads.phoneType,
        emails: leads.emails,
        reviewCount: leads.reviewCount,
        reviewRating: leads.reviewRating,
        latitude: leads.latitude,
        longitude: leads.longitude,
        mapsStatus: leads.mapsStatus,
        cleaningStatus: leads.cleaningStatus,
        whatsappStatus: leads.whatsappStatus,
        duplicateReason: leads.duplicateReason,
        duplicateOfLeadId: leads.duplicateOfLeadId,
        placeId: leads.placeId,
        cid: leads.cid,
        sourceRowKey: leads.sourceRowKey,
        rawData: leads.rawData,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .leftJoin(scrapeJobs, eq(leads.scrapeJobId, scrapeJobs.id))
      .where(eq(leads.id, id))
      .limit(1);

    if (!lead) {
      return {
        state: "not-found",
        lead: null,
      };
    }

    const campaignHistory = await db
      .select({
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        recipientStatus: campaignRecipients.status,
        attemptCount: campaignRecipients.attemptCount,
        errorMessage: campaignRecipients.errorMessage,
        sentAt: campaignRecipients.sentAt,
        createdAt: campaignRecipients.createdAt,
      })
      .from(campaignRecipients)
      .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
      .where(eq(campaignRecipients.leadId, id))
      .orderBy(desc(campaignRecipients.createdAt));

    return {
      state: "ready",
      lead: {
        ...lead,
        campaignHistory,
      },
    };
  } catch (error) {
    console.error("Gagal memuat detail lead", {
      leadId: id,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      lead: null,
    };
  }
}
