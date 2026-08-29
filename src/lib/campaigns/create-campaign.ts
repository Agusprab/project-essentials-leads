import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";

import { campaignRecipients, campaigns, leads } from "@/db/schema";
import { renderCampaignMessage } from "@/lib/campaigns/message-template";

export type CreateCampaignInput = {
  name: string;
  messageTemplate: string;
  recipientLimit: number;
  delayMs: number;
  delayMode: "fixed" | "random";
  delayMinMs: number;
  delayMaxMs: number;
  leadIds: string[];
  media:
    | {
        type: "image";
        fileName: string;
        mimeType: string;
        data: string;
      }
    | null;
};

export type CreateCampaignResult =
  | {
      state: "ready";
      campaignId: string;
      recipientCount: number;
    }
  | {
      state: "missing-config" | "no-recipients" | "database-error";
      campaignId: null;
      recipientCount: 0;
    };

export async function createCampaignDraft(
  input: CreateCampaignInput,
): Promise<CreateCampaignResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      campaignId: null,
      recipientCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const eligibleLeads = await db
      .select({
        id: leads.id,
        businessName: leads.businessName,
        category: leads.category,
        address: leads.address,
        website: leads.website,
        websiteDomain: leads.websiteDomain,
        phoneNormalized: leads.phoneNormalized,
        emails: leads.emails,
        reviewRating: leads.reviewRating,
        reviewCount: leads.reviewCount,
        latitude: leads.latitude,
        longitude: leads.longitude,
        mapsUrl: leads.mapsUrl,
      })
      .from(leads)
      .where(
        and(
          inArray(leads.id, input.leadIds),
          eq(leads.whatsappStatus, "eligible"),
          eq(leads.cleaningStatus, "clean"),
          isNotNull(leads.phoneNormalized),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(input.recipientLimit);

    const recipients = eligibleLeads.flatMap((lead) => {
      if (!lead.phoneNormalized) {
        return [];
      }

      return [
        {
          leadId: lead.id,
          phoneNormalized: lead.phoneNormalized,
          messageText: renderCampaignMessage(input.messageTemplate, {
            businessName: lead.businessName,
            category: lead.category,
            address: lead.address,
            website: lead.website,
            websiteDomain: lead.websiteDomain,
            phoneNormalized: lead.phoneNormalized,
            emails: lead.emails,
            reviewRating: lead.reviewRating,
            reviewCount: lead.reviewCount,
            latitude: lead.latitude,
            longitude: lead.longitude,
            mapsUrl: lead.mapsUrl,
          }),
        },
      ];
    });

    if (recipients.length === 0) {
      return {
        state: "no-recipients",
        campaignId: null,
        recipientCount: 0,
      };
    }

    const now = new Date();
    const [createdCampaign] = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          name: input.name,
          messageTemplate: input.messageTemplate,
          mediaType: input.media?.type ?? null,
          mediaFileName: input.media?.fileName ?? null,
          mediaMimeType: input.media?.mimeType ?? null,
          mediaData: input.media?.data ?? null,
          recipientLimit: input.recipientLimit,
          delayMs: input.delayMs,
          delayMode: input.delayMode,
          delayMinMs: input.delayMinMs,
          delayMaxMs: input.delayMaxMs,
          totalRecipients: recipients.length,
          pendingRecipients: recipients.length,
          updatedAt: now,
        })
        .returning({ id: campaigns.id });

      await tx.insert(campaignRecipients).values(
        recipients.map((recipient) => ({
          campaignId: campaign.id,
          leadId: recipient.leadId,
          phoneNormalized: recipient.phoneNormalized,
          messageText: recipient.messageText,
          updatedAt: now,
        })),
      );

      return [campaign];
    });

    return {
      state: "ready",
      campaignId: createdCampaign.id,
      recipientCount: recipients.length,
    };
  } catch (error) {
    console.error("Gagal membuat draft campaign", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      campaignId: null,
      recipientCount: 0,
    };
  }
}
