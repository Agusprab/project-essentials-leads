import { Worker } from "bullmq";
import { config } from "dotenv";

import { processCampaignRecipient } from "@/lib/campaigns/process-recipient";
import {
  campaignQueueName,
  type CampaignRecipientJob,
} from "@/lib/queue/campaigns";
import { getRedisConnection } from "@/lib/queue/connection";

config({
  path: ".env.local",
});

const worker = new Worker<CampaignRecipientJob>(
  campaignQueueName,
  async (job) => {
    const attempts = job.opts.attempts ?? 1;
    const result = await processCampaignRecipient(job.data.recipientId, {
      finalAttempt: job.attemptsMade + 1 >= attempts,
    });

    if (result.state === "send-error" || result.state === "missing-config") {
      throw new Error(`campaign_recipient_${result.state}`);
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1,
  },
);

worker.on("failed", (job, error) => {
  console.error("Campaign recipient job gagal", {
    jobId: job?.id,
    campaignId: job?.data.campaignId,
    recipientId: job?.data.recipientId,
    error: error.message,
  });
});

worker.on("completed", (job) => {
  console.info("Campaign recipient job selesai", {
    jobId: job.id,
    campaignId: job.data.campaignId,
    recipientId: job.data.recipientId,
  });
});
