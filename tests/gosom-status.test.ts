import assert from "node:assert/strict";
import test from "node:test";

import { isActiveGosomStatus } from "@/lib/gosom/status";

test("isActiveGosomStatus only treats unfinished Gosom statuses as active", () => {
  assert.equal(isActiveGosomStatus("pending"), true);
  assert.equal(isActiveGosomStatus("queued"), true);
  assert.equal(isActiveGosomStatus("running"), true);
  assert.equal(isActiveGosomStatus("working"), true);
  assert.equal(isActiveGosomStatus(" Running "), true);

  assert.equal(isActiveGosomStatus("ok"), false);
  assert.equal(isActiveGosomStatus("success"), false);
  assert.equal(isActiveGosomStatus("completed"), false);
  assert.equal(isActiveGosomStatus("imported"), false);
  assert.equal(isActiveGosomStatus("failed"), false);
  assert.equal(isActiveGosomStatus("error"), false);
});
