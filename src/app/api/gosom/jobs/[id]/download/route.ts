import { z } from "zod";

import { downloadGosomJobCsv } from "@/lib/gosom/client";

const paramsSchema = z.object({
  id: z.string().min(1).max(160),
});

export async function GET(_request: Request, context: RouteContext<"/api/gosom/jobs/[id]/download">) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return Response.json(
      {
        ok: false,
        error: "invalid_job_id",
      },
      { status: 400 },
    );
  }

  const result = await downloadGosomJobCsv(params.data.id);

  if (result.state === "missing-config") {
    return Response.json(
      {
        ok: false,
        error: "gosom_not_configured",
      },
      { status: 503 },
    );
  }

  if (result.state === "not-found") {
    return Response.json(
      {
        ok: false,
        error: "job_not_found",
      },
      { status: 404 },
    );
  }

  if (result.state === "error") {
    return Response.json(
      {
        ok: false,
        error: "download_failed",
      },
      { status: 502 },
    );
  }

  return new Response(result.csv, {
    headers: {
      "content-disposition": `attachment; filename="gosom-job-${params.data.id}.csv"`,
      "content-type": "text/csv; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
