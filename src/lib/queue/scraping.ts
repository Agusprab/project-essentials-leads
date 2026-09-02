import { getRedisConnection } from "@/lib/queue/connection";

export const scrapingQueueName = "scraping-jobs";

export type ScrapingQueueJob = {
  scrapeJobId: string;
};

function buildScrapingJobId(scrapeJobId: string): string {
  return `scrape-job-${scrapeJobId}`;
}

export async function getScrapingQueue() {
  const { Queue } = await import("bullmq");

  const queue = new Queue<ScrapingQueueJob>(scrapingQueueName, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 60_000,
      },
      removeOnComplete: 500,
      removeOnFail: 1_000,
    },
  });

  await queue.setGlobalConcurrency(1);

  return queue;
}

export async function enqueueScrapingJob(scrapeJobId: string): Promise<void> {
  const queue = await getScrapingQueue();

  try {
    await queue.add(
      "run-scrape-job",
      {
        scrapeJobId,
      },
      {
        jobId: buildScrapingJobId(scrapeJobId),
      },
    );
  } finally {
    await queue.close();
  }
}

export async function removeScrapingQueueJob(scrapeJobId: string): Promise<boolean> {
  const queue = await getScrapingQueue();

  try {
    const job = await queue.getJob(buildScrapingJobId(scrapeJobId));

    if (!job) {
      return false;
    }

    try {
      await job.remove();
      return true;
    } catch {
      return false;
    }
  } finally {
    await queue.close();
  }
}
