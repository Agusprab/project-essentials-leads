import { Worker } from "bullmq";
import { config } from "dotenv";

import { processScrapingJob } from "@/lib/scraping/process-job";
import {
  scrapingQueueName,
  type ScrapingQueueJob,
} from "@/lib/queue/scraping";
import { getRedisConnection } from "@/lib/queue/connection";

config({
  path: ".env.local",
});

const worker = new Worker<ScrapingQueueJob>(
  scrapingQueueName,
  async (job) => {
    const result = await processScrapingJob(job.data.scrapeJobId);

    if (
      result.state === "missing-config" ||
      result.state === "submit-error" ||
      result.state === "poll-error"
    ) {
      throw new Error(`scraping_job_${result.state}`);
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1,
  },
);

worker.on("failed", (job, error) => {
  console.error("Scraping queue job gagal", {
    jobId: job?.id,
    scrapeJobId: job?.data.scrapeJobId,
    error: error.message,
  });
});

worker.on("completed", (job) => {
  console.info("Scraping queue job selesai", {
    jobId: job.id,
    scrapeJobId: job.data.scrapeJobId,
  });
});
