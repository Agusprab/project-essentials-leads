import { and, eq, inArray } from "drizzle-orm";

import { campaignRecipients, campaigns } from "@/db/schema";
import { enqueueCampaignRecipients } from "@/lib/queue/campaigns";

export type ApproveCampaignResult =
  | {
      state: "ready";
      queuedCount: number;
    }
  | {
      state:
        | "missing-config"
        | "missing-redis"
        | "not-found"
        | "not-draft"
        | "no-recipients"
        | "database-error"
        | "queue-error";
      queuedCount: 0;
    };

export async function approveCampaign(
  campaignId: string,
): Promise<ApproveCampaignResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      queuedCount: 0,
    };
  }

  if (!process.env.REDIS_URL) {
    return {
      state: "missing-redis",
      queuedCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const now = new Date();
    const queueJobs = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .select({
          id: campaigns.id,
          status: campaigns.status,
        })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      if (!campaign) {
        return {
          state: "not-found" as const,
          jobs: [],
        };
      }

      if (campaign.status !== "draft") {
        return {
          state: "not-draft" as const,
          jobs: [],
        };
      }

      const recipients = await tx
        .select({
          id: campaignRecipients.id,
        })
        .from(campaignRecipients)
        .where(
          and(
            eq(campaignRecipients.campaignId, campaignId),
            eq(campaignRecipients.status, "pending"),
          ),
        );

      if (recipients.length === 0) {
        return {
          state: "no-recipients" as const,
          jobs: [],
        };
      }

      await tx
        .update(campaigns)
        .set({
          status: "queued",
          approvedAt: now,
          startedAt: now,
          updatedAt: now,
        })
        .where(eq(campaigns.id, campaignId));

      await tx
        .update(campaignRecipients)
        .set({
          status: "queued",
          queuedAt: now,
          updatedAt: now,
        })
        .where(
          inArray(
            campaignRecipients.id,
            recipients.map((recipient) => recipient.id),
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

    if (queueJobs.state !== "ready") {
      return {
        state: queueJobs.state,
        queuedCount: 0,
      };
    }

    try {
      const queuedCount = await enqueueCampaignRecipients(queueJobs.jobs);

      return {
        state: "ready",
        queuedCount,
      };
    } catch (error) {
      console.error("Gagal enqueue campaign", {
        campaignId,
        count: queueJobs.jobs.length,
        error: error instanceof Error ? error.message : "unknown_error",
      });

      await db
        .update(campaigns)
        .set({
          status: "draft",
          approvedAt: null,
          startedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));

      await db
        .update(campaignRecipients)
        .set({
          status: "pending",
          queuedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(campaignRecipients.campaignId, campaignId));

      return {
        state: "queue-error",
        queuedCount: 0,
      };
    }
  } catch (error) {
    console.error("Gagal approve campaign", {
      campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "database-error",
      queuedCount: 0,
    };
  }
}
