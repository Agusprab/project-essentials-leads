import type { GosomJob } from "@/lib/gosom/client";

const activeStatuses = new Set(["pending", "queued", "running"]);

export function isActiveGosomStatus(status: string): boolean {
  return activeStatuses.has(status.trim().toLowerCase());
}

export function countActiveGosomJobs(jobs: GosomJob[]): number {
  return jobs.filter((job) => isActiveGosomStatus(job.Status)).length;
}
