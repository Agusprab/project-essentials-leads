import { and, asc, count, eq, type SQL } from "drizzle-orm";

import { campaignRecipients, campaigns, leads } from "@/db/schema";

export type CampaignDetail = {
  id: string;
  name: string;
  messageTemplate: string;
  mediaType: string | null;
  mediaFileName: string | null;
  mediaMimeType: string | null;
  hasMedia: boolean;
  status: string;
  recipientLimit: number;
  delayMs: number;
  delayMode: string;
  delayMinMs: number;
  delayMaxMs: number;
  totalRecipients: number;
  pendingRecipients: number;
  sentRecipients: number;
  failedRecipients: number;
  unknownRecipients: number;
  createdAt: Date;
  updatedAt: Date;
  recipients: {
    id: string;
    leadId: string;
    businessName: string;
    category: string | null;
    phoneNormalized: string;
    messageText: string;
    status: string;
    attemptCount: number;
    errorMessage: string | null;
    queuedAt: Date | null;
    lastAttemptAt: Date | null;
    sentAt: Date | null;
  }[];
};

export type CampaignDetailResult =
  | {
      state: "ready";
      campaign: CampaignDetail;
    }
  | {
      state: "missing-config" | "not-found" | "error";
      campaign: null;
    };

export type CampaignRecipientStatusFilter =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "unknown"
  | "canceled";

export async function getCampaign(
  id: string,
  options: { recipientStatus?: CampaignRecipientStatusFilter } = {},
): Promise<CampaignDetailResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      campaign: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const [campaign] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        messageTemplate: campaigns.messageTemplate,
        mediaType: campaigns.mediaType,
        mediaFileName: campaigns.mediaFileName,
        mediaMimeType: campaigns.mediaMimeType,
        mediaData: campaigns.mediaData,
        status: campaigns.status,
        recipientLimit: campaigns.recipientLimit,
        delayMs: campaigns.delayMs,
        delayMode: campaigns.delayMode,
        delayMinMs: campaigns.delayMinMs,
        delayMaxMs: campaigns.delayMaxMs,
        totalRecipients: campaigns.totalRecipients,
        pendingRecipients: campaigns.pendingRecipients,
        sentRecipients: campaigns.sentRecipients,
        failedRecipients: campaigns.failedRecipients,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return {
        state: "not-found",
        campaign: null,
      };
    }

    const recipientWhere = buildRecipientWhere(id, options.recipientStatus);
    const [recipients, unknownRows] = await Promise.all([
      db
        .select({
          id: campaignRecipients.id,
          leadId: campaignRecipients.leadId,
          businessName: leads.businessName,
          category: leads.category,
          phoneNormalized: campaignRecipients.phoneNormalized,
          messageText: campaignRecipients.messageText,
          status: campaignRecipients.status,
          attemptCount: campaignRecipients.attemptCount,
          errorMessage: campaignRecipients.errorMessage,
          queuedAt: campaignRecipients.queuedAt,
          lastAttemptAt: campaignRecipients.lastAttemptAt,
          sentAt: campaignRecipients.sentAt,
        })
        .from(campaignRecipients)
        .innerJoin(leads, eq(campaignRecipients.leadId, leads.id))
        .where(recipientWhere)
        .orderBy(asc(leads.businessName)),
      db
        .select({ value: count() })
        .from(campaignRecipients)
        .where(
          and(
            eq(campaignRecipients.campaignId, id),
            eq(campaignRecipients.status, "unknown"),
          ),
        ),
    ]);

    return {
      state: "ready",
      campaign: {
        ...campaign,
        hasMedia: Boolean(campaign.mediaData),
        unknownRecipients: unknownRows[0]?.value ?? 0,
        recipients,
      },
    };
  } catch (error) {
    console.error("Gagal memuat detail campaign", {
      campaignId: id,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      campaign: null,
    };
  }
}

function buildRecipientWhere(
  campaignId: string,
  status: CampaignRecipientStatusFilter | undefined,
): SQL {
  if (!status) {
    return eq(campaignRecipients.campaignId, campaignId);
  }

  return and(
    eq(campaignRecipients.campaignId, campaignId),
    eq(campaignRecipients.status, status),
  )!;
}
