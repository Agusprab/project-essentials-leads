import { count, desc, eq } from "drizzle-orm";

import { campaigns, leads } from "@/db/schema";

export type CampaignListItem = {
  id: string;
  name: string;
  status: string;
  mediaType: string | null;
  recipientLimit: number;
  totalRecipients: number;
  pendingRecipients: number;
  sentRecipients: number;
  failedRecipients: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignListResult =
  | {
      state: "ready";
      campaigns: CampaignListItem[];
      eligibleLeadCount: number;
    }
  | {
      state: "missing-config" | "error";
      campaigns: [];
      eligibleLeadCount: 0;
    };

export async function listCampaigns(): Promise<CampaignListResult> {
  if (!process.env.DATABASE_URL) {
    return {
      state: "missing-config",
      campaigns: [],
      eligibleLeadCount: 0,
    };
  }

  try {
    const { db } = await import("@/db");
    const [campaignRows, eligibleRows] = await Promise.all([
      db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          status: campaigns.status,
          mediaType: campaigns.mediaType,
          recipientLimit: campaigns.recipientLimit,
          totalRecipients: campaigns.totalRecipients,
          pendingRecipients: campaigns.pendingRecipients,
          sentRecipients: campaigns.sentRecipients,
          failedRecipients: campaigns.failedRecipients,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
        })
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt)),
      db
        .select({ value: count() })
        .from(leads)
        .where(eq(leads.whatsappStatus, "eligible")),
    ]);

    return {
      state: "ready",
      campaigns: campaignRows,
      eligibleLeadCount: eligibleRows[0]?.value ?? 0,
    };
  } catch (error) {
    console.error("Gagal memuat campaign", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      campaigns: [],
      eligibleLeadCount: 0,
    };
  }
}
