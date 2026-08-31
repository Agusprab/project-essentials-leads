import assert from "node:assert/strict";
import test from "node:test";

import { buildCampaignReportCsv } from "@/lib/campaigns/report-csv";

test("buildCampaignReportCsv escapes report values for spreadsheet download", () => {
  const csv = buildCampaignReportCsv([
    {
      campaignName: "Promo, September",
      campaignStatus: "completed",
      businessName: "=Formula Shop",
      category: "Retail",
      phoneNormalized: "6281297974732",
      recipientStatus: "sent",
      attemptCount: 1,
      evolutionMessageId: "msg-001",
      errorMessage: null,
      queuedAt: new Date("2026-08-31T01:00:00.000Z"),
      lastAttemptAt: new Date("2026-08-31T01:01:00.000Z"),
      sentAt: new Date("2026-08-31T01:01:05.000Z"),
      website: "https://example.test",
      address: "Jl. Contoh",
      messageText: "Halo \"Owner\"\nTerima kasih",
    },
  ]);

  assert.match(csv, /"Promo, September"/);
  assert.match(csv, /"'=Formula Shop"/);
  assert.match(csv, /"Halo ""Owner""\nTerima kasih"/);
  assert.match(csv, /2026-08-31T01:01:05.000Z/);
});
