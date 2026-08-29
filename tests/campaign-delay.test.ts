import assert from "node:assert/strict";
import test from "node:test";

import { resolveCampaignDelayMs } from "@/lib/campaigns/delay";

test("resolveCampaignDelayMs returns fixed delay for fixed mode", () => {
  assert.equal(
    resolveCampaignDelayMs({
      delayMs: 3000,
      delayMode: "fixed",
      delayMinMs: 1000,
      delayMaxMs: 5000,
    }),
    3000,
  );
});

test("resolveCampaignDelayMs returns value inside random delay range", () => {
  for (let index = 0; index < 20; index += 1) {
    const delay = resolveCampaignDelayMs({
      delayMs: 3000,
      delayMode: "random",
      delayMinMs: 5000,
      delayMaxMs: 15000,
    });

    assert.ok(delay >= 5000);
    assert.ok(delay <= 15000);
  }
});
