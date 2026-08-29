import { and, count, eq, inArray } from "drizzle-orm";

import { campaignRecipients, campaigns } from "@/db/schema";
import {
  enqueueCampaignRecipients,
  removeCampaignRecipientJobs,
} from "@/lib/queue/campaigns";

export type CampaignControlResult =
  | {
      state: "ready";
      affectedCount: number;
    }
  | {
      state:
        | "missing-config"
        | "missing-redis"
        | "not-found"
        | "not-allowed"
        | "no-recipients"
        | "database-error"
        | "queue-error";
      affectedCount: 0;
    };

export async function cancelCampaign(
  campaignId: string,
): Promise<CampaignControlResult> {
  if (!process.env.DATABASE_URL) {
    return { state: "missing-config", affectedCount: 0 };
  }

  try {
    const { db } = await import("@/db");
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .select({
          id: campaigns.id,
          status: campaigns.status,
        })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      if (!campaign) {
        return { state: "not-found" as const, recipientIds: [] };
      }

      if (!["draft", "queued", "sending"].includes(campaign.status)) {
        return { state: "not-allowed" as const, recipientIds: [] };
      }

      const recipients = await tx
        .select({ id: campaignRecipients.id })
        .from(campaignRecipients)
        .where(
          and(
            eq(campaignRecipients.campaignId, campaignId),
            inArray(campaignRecipients.status, [
              "pending",
              "queued",
              "sending",
              "failed",
            ]),
          ),
        );

      await tx
        .update(campaignRecipients)
        .set({
          status: "canceled",
          updatedAt: now,
        })
        .where(
          and(
            eq(campaignRecipients.campaignId, campaignId),
            inArray(campaignRecipients.status, [
              "pending",
              "queued",
              "sending",
              "failed",
            ]),
          ),
        );

      await tx
        .update(campaigns)
        .set({
          status: "canceled",
          pendingRecipients: 0,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(campaigns.id, campaignId));

      return {
        state: "ready" as const,
        recipientIds: recipients.map((recipient) => recipient.id),
      };
    });

    if (process.env.REDIS_URL && result.recipientIds.length > 0) {
      try {
        await removeCampaignRecipientJobs(result.recipientIds);
      } catch (error) {
        console.error("Gagal menghapus job queue campaign saat cancel", {
          campaignId,
          count: result.recipientIds.length,
          error: error instanceof Error ? error.message : "unknown_error",
        });
      }
    }

    if (result.state !== "ready") {
      return {
        state: result.state,
        affectedCount: 0,
      };
    }

    return {
      state: "ready",
      affectedCount: result.recipientIds.length,
    };
  } catch (error) {
    console.error("Gagal cancel campaign", {
      campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return { state: "database-error", affectedCount: 0 };
  }
}

export async function retryFailedCampaignRecipients(
  campaignId: string,
): Promise<CampaignControlResult> {
  if (!process.env.DATABASE_URL) {
    return { state: "missing-config", affectedCount: 0 };
  }

  if (!process.env.REDIS_URL) {
    return { state: "missing-redis", affectedCount: 0 };
  }

  try {
    const { db } = await import("@/db");
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .select({
          id: campaigns.id,
          status: campaigns.status,
        })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      if (!campaign) {
        return { state: "not-found" as const, jobs: [] };
      }

      if (campaign.status === "canceled") {
        return { state: "not-allowed" as const, jobs: [] };
      }

      const recipients = await tx
        .select({
          id: campaignRecipients.id,
        })
        .from(campaignRecipients)
        .where(
          and(
            eq(campaignRecipients.campaignId, campaignId),
            eq(campaignRecipients.status, "failed"),
          ),
        );

      if (recipients.length === 0) {
        return { state: "no-recipients" as const, jobs: [] };
      }

      await tx
        .update(campaignRecipients)
        .set({
          status: "queued",
          queuedAt: now,
          errorMessage: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(campaignRecipients.campaignId, campaignId),
            eq(campaignRecipients.status, "failed"),
          ),
        );

      return {
        state: "ready" as const,
        jobs: recipients.map((recipient) => ({
          campaignId,
          recipientId: recipient.id,
        })),
      };
    });

    if (result.state !== "ready") {
      return { state: result.state, affectedCount: 0 };
    }

    try {
      const queuedCount = await enqueueCampaignRecipients(result.jobs);
      await refreshCampaignCounts(campaignId, "queued");

      return {
        state: "ready",
        affectedCount: queuedCount,
      };
    } catch (error) {
      console.error("Gagal enqueue retry campaign", {
        campaignId,
        count: result.jobs.length,
        error: error instanceof Error ? error.message : "unknown_error",
      });

      await db
        .update(campaignRecipients)
        .set({
          status: "failed",
          errorMessage: "Retry gagal masuk antrean Redis",
          updatedAt: new Date(),
        })
        .where(
          inArray(
            campaignRecipients.id,
            result.jobs.map((job) => job.recipientId),
          ),
        );

      await refreshCampaignCounts(campaignId, "completed");

      return { state: "queue-error", affectedCount: 0 };
    }
  } catch (error) {
    console.error("Gagal retry recipient campaign", {
      campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return { state: "database-error", affectedCount: 0 };
  }
}

async function refreshCampaignCounts(campaignId: string, nextStatus: string) {
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

  await db
    .update(campaigns)
    .set({
      status: nextStatus,
      pendingRecipients: pendingRows[0]?.value ?? 0,
      sentRecipients: sentRows[0]?.value ?? 0,
      failedRecipients: failedRows[0]?.value ?? 0,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));
}
