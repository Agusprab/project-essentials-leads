import type { GosomJob } from "@/lib/gosom/client";

export const activeGosomStatuses = ["pending", "queued", "submitting", "running", "working"] as const;

const activeStatuses = new Set<string>(activeGosomStatuses);
const completedStatuses = new Set<string>(["ok", "success", "completed", "imported"]);
const failedStatuses = new Set<string>(["failed", "error", "cancelled", "canceled"]);

export function isActiveGosomStatus(status: string): boolean {
  return activeStatuses.has(status.trim().toLowerCase());
}

export function isCompletedGosomStatus(status: string): boolean {
  return completedStatuses.has(status.trim().toLowerCase());
}

export function isFailedGosomStatus(status: string): boolean {
  return failedStatuses.has(status.trim().toLowerCase());
}

export function countActiveGosomJobs(jobs: GosomJob[]): number {
  return jobs.filter((job) => isActiveGosomStatus(job.Status)).length;
}
