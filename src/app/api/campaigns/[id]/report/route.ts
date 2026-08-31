import { cookies } from "next/headers";
import { z } from "zod";

import {
  authCookieName,
  getAuthConfig,
  verifyAuthSessionValue,
} from "@/lib/auth/session";
import { exportCampaignReportCsv } from "@/lib/campaigns/report-csv";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/campaigns/[id]/report">,
) {
  const authConfig = getAuthConfig();
  const cookieStore = await cookies();
  const isAuthenticated = await verifyAuthSessionValue(
    cookieStore.get(authCookieName)?.value,
    authConfig,
  );

  if (!isAuthenticated) {
    return Response.json(
      {
        ok: false,
        error: "unauthorized",
      },
      { status: 401 },
    );
  }

  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return Response.json(
      {
        ok: false,
        error: "invalid_campaign_id",
      },
      { status: 400 },
    );
  }

  const result = await exportCampaignReportCsv(params.data.id);

  if (result.state === "missing-config") {
    return Response.json(
      {
        ok: false,
        error: "database_not_configured",
      },
      { status: 503 },
    );
  }

  if (result.state === "not-found") {
    return Response.json(
      {
        ok: false,
        error: "campaign_not_found",
      },
      { status: 404 },
    );
  }

  if (result.state === "error") {
    return Response.json(
      {
        ok: false,
        error: "report_failed",
      },
      { status: 500 },
    );
  }

  return new Response(result.csv, {
    headers: {
      "content-disposition": `attachment; filename="${result.filename}"`,
      "content-type": "text/csv; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
