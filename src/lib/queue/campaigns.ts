import { getRedisConnection } from "@/lib/queue/connection";

export const campaignQueueName = "campaign-send";

export type CampaignRecipientJob = {
  campaignId: string;
  recipientId: string;
};

function buildCampaignRecipientJobId(recipientId: string): string {
  return `campaign-recipient-${recipientId}`;
}

export type CampaignQueueStatus =
  | {
      state: "ready";
      waiting: number;
      active: number;
      delayed: number;
      failed: number;
    }
  | {
      state: "missing-config" | "error";
      waiting: 0;
      active: 0;
      delayed: 0;
      failed: 0;
    };

export async function getCampaignQueue() {
  const { Queue } = await import("bullmq");

  return new Queue<CampaignRecipientJob>(campaignQueueName, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30_000,
      },
      removeOnComplete: 500,
      removeOnFail: 1_000,
    },
  });
}

export async function enqueueCampaignRecipients(
  jobs: CampaignRecipientJob[],
): Promise<number> {
  if (jobs.length === 0) {
    return 0;
  }

  const queue = await getCampaignQueue();

  try {
    await queue.addBulk(
      jobs.map((job) => ({
        name: "send-recipient",
        data: job,
        opts: {
          jobId: buildCampaignRecipientJobId(job.recipientId),
        },
      })),
    );

    return jobs.length;
  } finally {
    await queue.close();
  }
}

export async function removeCampaignRecipientJobs(
  recipientIds: string[],
): Promise<number> {
  if (recipientIds.length === 0) {
    return 0;
  }

  const queue = await getCampaignQueue();
  let removedCount = 0;

  try {
    for (const recipientId of recipientIds) {
      const job = await queue.getJob(buildCampaignRecipientJobId(recipientId));

      if (!job) {
        continue;
      }

      try {
        await job.remove();
        removedCount += 1;
      } catch {
        // Active jobs cannot always be removed; the DB status still prevents new sends.
      }
    }

    return removedCount;
  } finally {
    await queue.close();
  }
}

export async function getCampaignQueueStatus(): Promise<CampaignQueueStatus> {
  if (!process.env.REDIS_URL) {
    return {
      state: "missing-config",
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
    };
  }

  try {
    const queue = await getCampaignQueue();

    try {
      const counts = await queue.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "failed",
      );

      return {
        state: "ready",
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        delayed: counts.delayed ?? 0,
        failed: counts.failed ?? 0,
      };
    } finally {
      await queue.close();
    }
  } catch (error) {
    console.error("Gagal membaca status queue campaign", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
    };
  }
}
