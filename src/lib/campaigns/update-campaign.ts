import { and, eq, inArray } from "drizzle-orm";

import { campaignRecipients, campaigns, leads } from "@/db/schema";
import { renderCampaignMessage } from "@/lib/campaigns/message-template";
import type { EvolutionMediaType } from "@/lib/evolution/client";

export type CampaignMediaInput = {
  type: EvolutionMediaType;
  fileName: string;
  mimeType: string;
  data: string;
} | null;

export type UpdateCampaignDraftInput = {
  campaignId: string;
  name: string;
  messageTemplate: string;
  recipientLimit: number;
  delayMs: number;
  delayMode: "fixed" | "random";
  delayMinMs: number;
  delayMaxMs: number;
  mediaMode: "keep" | "remove" | "replace";
  media: CampaignMediaInput;
};

export type CampaignMutationResult =
  | {
      state: "ready";
      campaignId: string;
    }
  | {
      state: "missing-config" | "not-found" | "not-draft" | "database-error";
      campaignId: null;
    };

export async function updateCampaignDraft(
  input: UpdateCampaignDraftInput,
): Promise<CampaignMutationResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      campaignId: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const [campaign] = await db
      .select({
        id: campaigns.id,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .limit(1);

    if (!campaign) {
      return {
        state: "not-found",
        campaignId: null,
      };
    }

    if (campaign.status !== "draft") {
      return {
        state: "not-draft",
        campaignId: null,
      };
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      const mediaSet =
        input.mediaMode === "replace" && input.media
          ? {
              mediaType: input.media.type,
              mediaFileName: input.media.fileName,
              mediaMimeType: input.media.mimeType,
              mediaData: input.media.data,
            }
          : input.mediaMode === "remove"
            ? {
                mediaType: null,
                mediaFileName: null,
                mediaMimeType: null,
                mediaData: null,
              }
            : {};

      await tx
        .update(campaigns)
        .set({
          name: input.name,
          messageTemplate: input.messageTemplate,
          recipientLimit: input.recipientLimit,
          delayMs: input.delayMs,
          delayMode: input.delayMode,
          delayMinMs: input.delayMinMs,
          delayMaxMs: input.delayMaxMs,
          ...mediaSet,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId));

      const recipients = await tx
        .select({
          recipientId: campaignRecipients.id,
          businessName: leads.businessName,
          category: leads.category,
          address: leads.address,
          website: leads.website,
          websiteDomain: leads.websiteDomain,
          phoneNormalized: campaignRecipients.phoneNormalized,
          emails: leads.emails,
          reviewRating: leads.reviewRating,
          reviewCount: leads.reviewCount,
          latitude: leads.latitude,
          longitude: leads.longitude,
          mapsUrl: leads.mapsUrl,
        })
        .from(campaignRecipients)
        .innerJoin(leads, eq(campaignRecipients.leadId, leads.id))
        .where(
          and(
            eq(campaignRecipients.campaignId, input.campaignId),
            inArray(campaignRecipients.status, ["pending", "queued"]),
          ),
        );

      for (const recipient of recipients) {
        await tx
          .update(campaignRecipients)
          .set({
            messageText: renderCampaignMessage(input.messageTemplate, {
              businessName: recipient.businessName,
              category: recipient.category,
              address: recipient.address,
              website: recipient.website,
              websiteDomain: recipient.websiteDomain,
              phoneNormalized: recipient.phoneNormalized,
              emails: recipient.emails,
              reviewRating: recipient.reviewRating,
              reviewCount: recipient.reviewCount,
              latitude: recipient.latitude,
              longitude: recipient.longitude,
              mapsUrl: recipient.mapsUrl,
            }),
            updatedAt: now,
          })
          .where(eq(campaignRecipients.id, recipient.recipientId));
      }
    });

    return {
      state: "ready",
      campaignId: input.campaignId,
    };
  } catch (error) {
    console.error("Gagal memperbarui draft campaign", {
      campaignId: input.campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      campaignId: null,
    };
  }
}

export async function duplicateCampaign(
  campaignId: string,
): Promise<CampaignMutationResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      campaignId: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return {
        state: "not-found",
        campaignId: null,
      };
    }

    const recipients = await db
      .select({
        leadId: campaignRecipients.leadId,
        phoneNormalized: campaignRecipients.phoneNormalized,
        messageText: campaignRecipients.messageText,
      })
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId));
    const now = new Date();
    const [createdCampaign] = await db.transaction(async (tx) => {
      const [newCampaign] = await tx
        .insert(campaigns)
        .values({
          name: `Salinan - ${campaign.name}`,
          messageTemplate: campaign.messageTemplate,
          mediaType: campaign.mediaType,
          mediaFileName: campaign.mediaFileName,
          mediaMimeType: campaign.mediaMimeType,
          mediaData: campaign.mediaData,
          status: "draft",
          recipientLimit: campaign.recipientLimit,
          delayMs: campaign.delayMs,
          delayMode: campaign.delayMode,
          delayMinMs: campaign.delayMinMs,
          delayMaxMs: campaign.delayMaxMs,
          totalRecipients: recipients.length,
          pendingRecipients: recipients.length,
          sentRecipients: 0,
          failedRecipients: 0,
          updatedAt: now,
        })
        .returning({ id: campaigns.id });

      if (recipients.length > 0) {
        await tx.insert(campaignRecipients).values(
          recipients.map((recipient) => ({
            campaignId: newCampaign.id,
            leadId: recipient.leadId,
            phoneNormalized: recipient.phoneNormalized,
            messageText: recipient.messageText,
            status: "pending",
            attemptCount: 0,
            updatedAt: now,
          })),
        );
      }

      return [newCampaign];
    });

    return {
      state: "ready",
      campaignId: createdCampaign.id,
    };
  } catch (error) {
    console.error("Gagal menduplikasi campaign", {
      campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      campaignId: null,
    };
  }
}
