import type { GosomJob } from "@/lib/gosom/client";

export const activeGosomStatuses = ["pending", "queued", "running", "working"] as const;

const activeStatuses = new Set<string>(activeGosomStatuses);

export function isActiveGosomStatus(status: string): boolean {
  return activeStatuses.has(status.trim().toLowerCase());
}

export function countActiveGosomJobs(jobs: GosomJob[]): number {
  return jobs.filter((job) => isActiveGosomStatus(job.Status)).length;
}
