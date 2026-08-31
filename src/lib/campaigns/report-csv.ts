import { asc, eq } from "drizzle-orm";

import { campaignRecipients, campaigns, leads } from "@/db/schema";

export type CampaignReportResult =
  | {
      state: "ready";
      filename: string;
      csv: string;
    }
  | {
      state: "missing-config" | "not-found" | "error";
      filename: null;
      csv: null;
    };

type CampaignReportRow = {
  campaignName: string;
  campaignStatus: string;
  businessName: string;
  category: string | null;
  phoneNormalized: string;
  recipientStatus: string;
  attemptCount: number;
  evolutionMessageId: string | null;
  errorMessage: string | null;
  queuedAt: Date | null;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  website: string | null;
  address: string | null;
  messageText: string;
};

const reportHeaders = [
  "campaign",
  "status_campaign",
  "nama_bisnis",
  "kategori",
  "nomor_whatsapp",
  "status_pengiriman",
  "jumlah_attempt",
  "evolution_message_id",
  "error",
  "waktu_antre",
  "waktu_attempt_terakhir",
  "waktu_terkirim",
  "website",
  "alamat",
  "pesan",
] as const;

export async function exportCampaignReportCsv(
  campaignId: string,
): Promise<CampaignReportResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      filename: null,
      csv: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const [campaign] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return {
        state: "not-found",
        filename: null,
        csv: null,
      };
    }

    const rows = await db
      .select({
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        businessName: leads.businessName,
        category: leads.category,
        phoneNormalized: campaignRecipients.phoneNormalized,
        recipientStatus: campaignRecipients.status,
        attemptCount: campaignRecipients.attemptCount,
        evolutionMessageId: campaignRecipients.evolutionMessageId,
        errorMessage: campaignRecipients.errorMessage,
        queuedAt: campaignRecipients.queuedAt,
        lastAttemptAt: campaignRecipients.lastAttemptAt,
        sentAt: campaignRecipients.sentAt,
        website: leads.website,
        address: leads.completeAddress,
        messageText: campaignRecipients.messageText,
      })
      .from(campaignRecipients)
      .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
      .innerJoin(leads, eq(campaignRecipients.leadId, leads.id))
      .where(eq(campaignRecipients.campaignId, campaignId))
      .orderBy(asc(campaignRecipients.status), asc(leads.businessName));

    return {
      state: "ready",
      filename: `campaign-report-${slugify(campaign.name)}.csv`,
      csv: buildCampaignReportCsv(rows),
    };
  } catch (error) {
    console.error("Gagal membuat report CSV campaign", {
      campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      filename: null,
      csv: null,
    };
  }
}

export function buildCampaignReportCsv(rows: CampaignReportRow[]): string {
  const lines = [
    reportHeaders.join(","),
    ...rows.map((row) =>
      [
        row.campaignName,
        row.campaignStatus,
        row.businessName,
        row.category,
        row.phoneNormalized,
        row.recipientStatus,
        row.attemptCount,
        row.evolutionMessageId,
        row.errorMessage,
        formatCsvDate(row.queuedAt),
        formatCsvDate(row.lastAttemptAt),
        formatCsvDate(row.sentAt),
        row.website,
        row.address,
        row.messageText,
      ]
        .map(formatCsvCell)
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function formatCsvCell(value: string | number | null): string {
  const rawValue = value === null ? "" : String(value);
  const safeValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;

  return `"${safeValue.replaceAll('"', '""')}"`;
}

function formatCsvDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "campaign";
}
