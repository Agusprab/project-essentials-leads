import { and, count, eq, inArray } from "drizzle-orm";

import { campaignRecipients, campaigns } from "@/db/schema";
import { resolveCampaignDelayMs } from "@/lib/campaigns/delay";
import {
  sendEvolutionImageMessage,
  sendEvolutionTextMessage,
} from "@/lib/evolution/client";

export type ProcessCampaignRecipientResult =
  | {
      state: "ready" | "skipped";
    }
  | {
      state: "missing-config" | "not-found" | "send-error";
    };

export async function processCampaignRecipient(
  recipientId: string,
  options: { finalAttempt?: boolean } = {},
): Promise<ProcessCampaignRecipientResult> {
  if (!process.env.DATABASE_URL) {
    return { state: "missing-config" };
  }

  const { db } = await import("@/db");
  const [recipient] = await db
    .select({
      id: campaignRecipients.id,
      campaignId: campaignRecipients.campaignId,
      status: campaignRecipients.status,
      phoneNormalized: campaignRecipients.phoneNormalized,
      messageText: campaignRecipients.messageText,
      attemptCount: campaignRecipients.attemptCount,
      delayMs: campaigns.delayMs,
      delayMode: campaigns.delayMode,
      delayMinMs: campaigns.delayMinMs,
      delayMaxMs: campaigns.delayMaxMs,
      mediaType: campaigns.mediaType,
      mediaFileName: campaigns.mediaFileName,
      mediaMimeType: campaigns.mediaMimeType,
      mediaData: campaigns.mediaData,
      campaignStatus: campaigns.status,
    })
    .from(campaignRecipients)
    .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
    .where(eq(campaignRecipients.id, recipientId))
    .limit(1);

  if (!recipient) {
    return { state: "not-found" };
  }

  if (recipient.campaignStatus === "canceled") {
    return { state: "skipped" };
  }

  if (recipient.status === "sent") {
    return { state: "skipped" };
  }

  if (
    recipient.status !== "queued" &&
    recipient.status !== "pending" &&
    recipient.status !== "failed"
  ) {
    return { state: "skipped" };
  }

  const attemptStartedAt = new Date();
  const [claimedRecipient] = await db
    .update(campaignRecipients)
    .set({
      status: "sending",
      attemptCount: recipient.attemptCount + 1,
      lastAttemptAt: attemptStartedAt,
      updatedAt: attemptStartedAt,
    })
    .where(
      and(
        eq(campaignRecipients.id, recipient.id),
        eq(campaignRecipients.status, recipient.status),
      ),
    )
    .returning({ id: campaignRecipients.id });

  if (!claimedRecipient) {
    return { state: "skipped" };
  }

  const delay = resolveCampaignDelayMs(recipient);
  const result =
    recipient.mediaType === "image" &&
    recipient.mediaFileName &&
    recipient.mediaMimeType &&
    recipient.mediaData
      ? await sendEvolutionImageMessage({
          number: recipient.phoneNormalized,
          caption: recipient.messageText,
          delay,
          fileName: recipient.mediaFileName,
          mimeType: recipient.mediaMimeType,
          media: recipient.mediaData,
        })
      : await sendEvolutionTextMessage({
          number: recipient.phoneNormalized,
          text: recipient.messageText,
          delay,
        });

  if (result.state !== "ready") {
    const failedAt = new Date();
    await db
      .update(campaignRecipients)
      .set({
        status: options.finalAttempt ? "failed" : "queued",
        errorMessage:
          result.state === "missing-config"
            ? "Evolution API belum dikonfigurasi"
            : "Evolution API menolak atau gagal merespons",
        updatedAt: failedAt,
      })
      .where(eq(campaignRecipients.id, recipient.id));
    await refreshCampaignCounts(recipient.campaignId);

    return { state: "send-error" };
  }

  const sentAt = new Date();
  await db
    .update(campaignRecipients)
    .set({
      status: "sent",
      evolutionMessageId: result.messageId,
      errorMessage: null,
      sentAt,
      updatedAt: sentAt,
    })
    .where(eq(campaignRecipients.id, recipient.id));
  await refreshCampaignCounts(recipient.campaignId);

  return { state: "ready" };
}

async function refreshCampaignCounts(campaignId: string) {
  const { db } = await import("@/db");
  const [pendingRows, sentRows, failedRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          inArray(campaignRecipients.status, ["queued", "sending"]),
        ),
      ),
    db
      .select({ value: count() })
      .from(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.status, "sent"),
        ),
      ),
    db
      .select({ value: count() })
      .from(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          eq(campaignRecipients.status, "failed"),
        ),
      ),
  ]);

  const pendingRecipients = pendingRows[0]?.value ?? 0;
  const sentRecipients = sentRows[0]?.value ?? 0;
  const failedRecipients = failedRows[0]?.value ?? 0;
  const completedAt =
    pendingRecipients === 0 && sentRecipients + failedRecipients > 0
      ? new Date()
      : null;

  await db
    .update(campaigns)
    .set({
      status: completedAt ? "completed" : "sending",
      pendingRecipients,
      sentRecipients,
      failedRecipients,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));
}
