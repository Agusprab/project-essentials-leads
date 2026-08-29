import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthSessionValue,
  resolveAuthCookieSecure,
  verifyAuthSessionValue,
} from "@/lib/auth/session";

test("auth session value verifies with matching config", async () => {
  const value = await createAuthSessionValue("admin@example.com", "secret");

  const isValid = await verifyAuthSessionValue(value, {
    state: "ready",
    email: "admin@example.com",
    password: "password",
    secret: "secret",
  });

  assert.equal(isValid, true);
});

test("auth session value rejects a different secret", async () => {
  const value = await createAuthSessionValue("admin@example.com", "secret");

  const isValid = await verifyAuthSessionValue(value, {
    state: "ready",
    email: "admin@example.com",
    password: "password",
    secret: "other-secret",
  });

  assert.equal(isValid, false);
});

test("resolveAuthCookieSecure follows forwarded proto", () => {
  assert.equal(
    resolveAuthCookieSecure({
      forwardedProto: "https",
      override: undefined,
    }),
    true,
  );
  assert.equal(
    resolveAuthCookieSecure({
      forwardedProto: "http",
      override: undefined,
    }),
    false,
  );
});

test("resolveAuthCookieSecure supports explicit override", () => {
  assert.equal(
    resolveAuthCookieSecure({
      forwardedProto: "http",
      override: "true",
    }),
    true,
  );
  assert.equal(
    resolveAuthCookieSecure({
      forwardedProto: "https",
      override: "false",
    }),
    false,
  );
});
