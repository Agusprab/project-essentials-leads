import assert from "node:assert/strict";
import test from "node:test";

import { formatEnvValue } from "@/lib/settings/status";

test("formatEnvValue hides secret-like env values", () => {
  assert.equal(formatEnvValue("EVOLUTION_API_KEY", "secret"), "Terisi, disembunyikan");
});

test("formatEnvValue shows only URL origin", () => {
  assert.equal(
    formatEnvValue("GOSOM_API_URL", "http://localhost:8085/path?q=1"),
    "http://localhost:8085",
  );
});

test("formatEnvValue marks missing values", () => {
  assert.equal(formatEnvValue("REDIS_URL", undefined), "Belum diisi");
});
