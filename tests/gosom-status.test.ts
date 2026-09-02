import assert from "node:assert/strict";
import test from "node:test";

import {
  isActiveGosomStatus,
  isCompletedGosomStatus,
  isFailedGosomStatus,
} from "@/lib/gosom/status";

test("isActiveGosomStatus only treats unfinished Gosom statuses as active", () => {
  assert.equal(isActiveGosomStatus("pending"), true);
  assert.equal(isActiveGosomStatus("queued"), true);
  assert.equal(isActiveGosomStatus("running"), true);
  assert.equal(isActiveGosomStatus("working"), true);
  assert.equal(isActiveGosomStatus("submitting"), true);
  assert.equal(isActiveGosomStatus(" Running "), true);

  assert.equal(isActiveGosomStatus("ok"), false);
  assert.equal(isActiveGosomStatus("success"), false);
  assert.equal(isActiveGosomStatus("completed"), false);
  assert.equal(isActiveGosomStatus("imported"), false);
  assert.equal(isActiveGosomStatus("failed"), false);
  assert.equal(isActiveGosomStatus("error"), false);
});

test("Gosom completion and failure status helpers classify terminal states", () => {
  assert.equal(isCompletedGosomStatus("ok"), true);
  assert.equal(isCompletedGosomStatus("completed"), true);
  assert.equal(isCompletedGosomStatus(" imported "), true);
  assert.equal(isCompletedGosomStatus("running"), false);

  assert.equal(isFailedGosomStatus("failed"), true);
  assert.equal(isFailedGosomStatus("error"), true);
  assert.equal(isFailedGosomStatus("cancelled"), true);
  assert.equal(isFailedGosomStatus("ok"), false);
});
