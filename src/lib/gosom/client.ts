import { z } from "zod";

const gosomJobDataSchema = z.object({
  keywords: z.array(z.string()).default([]),
  lang: z.string().default("id"),
  zoom: z.number().int().default(15),
  lat: z.string().nullable().optional(),
  lon: z.string().nullable().optional(),
  fast_mode: z.boolean().default(false),
  radius: z.number().int().nullable().optional(),
  depth: z.number().int().default(1),
  email: z.boolean().default(false),
  extra_reviews: z.boolean().optional(),
  max_time: z.number().finite().nullable().default(0),
  proxies: z.array(z.string()).nullable().optional(),
});

const gosomJobSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  Date: z.string(),
  Status: z.string(),
  Data: gosomJobDataSchema,
});

const createGosomJobResponseSchema = z.union([
  gosomJobSchema,
  z.object({ job: gosomJobSchema }),
  z.object({ Job: gosomJobSchema }),
  z.object({ data: gosomJobSchema }),
  z.object({ ID: z.string() }).passthrough(),
  z.object({ id: z.string() }).passthrough(),
  z.object({ job_id: z.string() }).passthrough(),
  z.object({ jobId: z.string() }).passthrough(),
  z.object({}).passthrough(),
]);

const gosomJobsEnvelopeSchema = z.union([
  z.array(gosomJobSchema),
  z.object({ jobs: z.array(gosomJobSchema) }),
  z.object({ Jobs: z.array(gosomJobSchema) }),
  z.object({ data: z.array(gosomJobSchema) }),
  z.object({}).strict(),
]);

const createGosomJobInputSchema = z.object({
  name: z.string().min(1).max(160),
  keywords: z.array(z.string().min(1)).min(1).max(20),
  lang: z.string().min(2).max(12),
  lat: z.string().min(1).max(40),
  lon: z.string().min(1).max(40),
  zoom: z.number().int().min(1).max(21),
  radius: z.number().int().min(100).max(100_000),
  depth: z.number().int().min(1).max(50),
  fast_mode: z.boolean(),
  email: z.boolean(),
  extra_reviews: z.boolean(),
  max_time: z.number().int().min(60).max(10_800),
});

export type GosomJob = z.infer<typeof gosomJobSchema>;

export type GosomJobsResult =
  | {
      state: "ready";
      jobs: GosomJob[];
    }
  | {
      state: "missing-config" | "error";
      jobs: [];
    };

export type GosomCsvDownloadResult =
  | {
      state: "ready";
      csv: string;
    }
  | {
      state: "missing-config" | "not-found" | "error";
      csv: null;
    };

export type CreateGosomJobInput = z.infer<typeof createGosomJobInputSchema>;

export type GosomMutationResult =
  | {
      state: "ready";
      job: GosomJob | null;
      jobId: string | null;
    }
  | {
      state: "missing-config" | "not-found" | "error";
      job?: null;
      jobId?: null;
    };

export type GosomJobResult =
  | {
      state: "ready";
      job: GosomJob;
    }
  | {
      state: "missing-config" | "not-found" | "error";
      job: null;
    };

export async function listGosomJobs(): Promise<GosomJobsResult> {
  const baseUrl = process.env.GOSOM_API_URL;

  if (!baseUrl) {
    return {
      state: "missing-config",
      jobs: [],
    };
  }

  try {
    const response = await fetch(new URL("/api/v1/jobs", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`gosom_http_${response.status}`);
    }

    if (response.status === 204) {
      return {
        state: "ready",
        jobs: [],
      };
    }

    const responseBody = await response.text();

    if (!responseBody.trim()) {
      return {
        state: "ready",
        jobs: [],
      };
    }

    const payload: unknown = JSON.parse(responseBody);
    const parsed = gosomJobsEnvelopeSchema.parse(payload);

    return {
      state: "ready",
      jobs: extractJobs(parsed),
    };
  } catch (error) {
    console.error("Gagal mengambil daftar job Gosom", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      jobs: [],
    };
  }
}

export async function createGosomJob(
  input: CreateGosomJobInput,
): Promise<GosomMutationResult> {
  const baseUrl = process.env.GOSOM_API_URL;

  if (!baseUrl) {
    return {
      state: "missing-config",
    };
  }

  try {
    const body = createGosomJobInputSchema.parse(input);
    const response = await fetch(new URL("/api/v1/jobs", baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`gosom_create_http_${response.status}`);
    }

    const responseBody = await response.text();

    if (!responseBody.trim()) {
      return {
        state: "ready",
        job: null,
        jobId: null,
      };
    }

    const payload: unknown = JSON.parse(responseBody);
    const parsed = createGosomJobResponseSchema.parse(payload);
    const job = extractCreatedJob(parsed);

    return {
      state: "ready",
      job,
      jobId: job?.ID ?? extractCreatedJobId(parsed),
    };
  } catch (error) {
    console.error("Gagal membuat job Gosom", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
    };
  }
}

export async function deleteGosomJob(
  jobId: string,
): Promise<GosomMutationResult> {
  const baseUrl = process.env.GOSOM_API_URL;

  if (!baseUrl) {
    return {
      state: "missing-config",
    };
  }

  try {
    const response = await fetch(
      new URL(`/api/v1/jobs/${encodeURIComponent(jobId)}`, baseUrl),
      {
        method: "DELETE",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (response.status === 404) {
      return {
        state: "not-found",
      };
    }

    if (!response.ok) {
      throw new Error(`gosom_delete_http_${response.status}`);
    }

    return {
      state: "ready",
      job: null,
      jobId: jobId,
    };
  } catch (error) {
    console.error("Gagal menghapus job Gosom", {
      jobId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
    };
  }
}

export async function getGosomJob(jobId: string): Promise<GosomJobResult> {
  const baseUrl = process.env.GOSOM_API_URL;

  if (!baseUrl) {
    return {
      state: "missing-config",
      job: null,
    };
  }

  try {
    const response = await fetch(
      new URL(`/api/v1/jobs/${encodeURIComponent(jobId)}`, baseUrl),
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (response.status === 404) {
      return {
        state: "not-found",
        job: null,
      };
    }

    if (!response.ok) {
      throw new Error(`gosom_job_http_${response.status}`);
    }

    const payload: unknown = await response.json();
    const parsed = z
      .union([
        gosomJobSchema,
        z.object({ job: gosomJobSchema }),
        z.object({ Job: gosomJobSchema }),
        z.object({ data: gosomJobSchema }),
      ])
      .parse(payload);

    return {
      state: "ready",
      job: extractJob(parsed),
    };
  } catch (error) {
    console.error("Gagal mengambil detail job Gosom", {
      jobId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      job: null,
    };
  }
}

export async function downloadGosomJobCsv(
  jobId: string,
): Promise<GosomCsvDownloadResult> {
  const baseUrl = process.env.GOSOM_API_URL;

  if (!baseUrl) {
    return {
      state: "missing-config",
      csv: null,
    };
  }

  try {
    const response = await fetch(
      new URL(`/api/v1/jobs/${encodeURIComponent(jobId)}/download`, baseUrl),
      {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (response.status === 404) {
      return {
        state: "not-found",
        csv: null,
      };
    }

    if (!response.ok) {
      throw new Error(`gosom_download_http_${response.status}`);
    }

    return {
      state: "ready",
      csv: await response.text(),
    };
  } catch (error) {
    console.error("Gagal mengunduh CSV job Gosom", {
      jobId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      csv: null,
    };
  }
}

function extractJobs(payload: z.infer<typeof gosomJobsEnvelopeSchema>): GosomJob[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if ("jobs" in payload) {
    return payload.jobs;
  }

  if ("Jobs" in payload) {
    return payload.Jobs;
  }

  if (!("data" in payload)) {
    return [];
  }

  return payload.data;
}

function extractJob(
  payload:
    | GosomJob
    | { job: GosomJob }
    | { Job: GosomJob }
    | { data: GosomJob },
): GosomJob {
  if ("ID" in payload) {
    return payload;
  }

  if ("job" in payload) {
    return payload.job;
  }

  if ("Job" in payload) {
    return payload.Job;
  }

  return payload.data;
}

function extractCreatedJob(
  payload: z.infer<typeof createGosomJobResponseSchema>,
): GosomJob | null {
  const directJob = gosomJobSchema.safeParse(payload);

  if (directJob.success) {
    return directJob.data;
  }

  if ("job" in payload) {
    const parsed = gosomJobSchema.safeParse(payload.job);
    return parsed.success ? parsed.data : null;
  }

  if ("Job" in payload) {
    const parsed = gosomJobSchema.safeParse(payload.Job);
    return parsed.success ? parsed.data : null;
  }

  if ("data" in payload) {
    const parsed = gosomJobSchema.safeParse(payload.data);
    return parsed.success ? parsed.data : null;
  }

  return null;
}

function extractCreatedJobId(
  payload: z.infer<typeof createGosomJobResponseSchema>,
): string | null {
  if ("ID" in payload && typeof payload.ID === "string") {
    return payload.ID;
  }

  if ("id" in payload && typeof payload.id === "string") {
    return payload.id;
  }

  if ("job_id" in payload && typeof payload.job_id === "string") {
    return payload.job_id;
  }

  if ("jobId" in payload && typeof payload.jobId === "string") {
    return payload.jobId;
  }

  return null;
}
