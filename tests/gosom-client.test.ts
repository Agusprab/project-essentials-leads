import assert from "node:assert/strict";
import test from "node:test";

import { listGosomJobs } from "@/lib/gosom/client";

const originalGosomApiUrl = process.env.GOSOM_API_URL;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (originalGosomApiUrl === undefined) {
    delete process.env.GOSOM_API_URL;
  } else {
    process.env.GOSOM_API_URL = originalGosomApiUrl;
  }

  globalThis.fetch = originalFetch;
});

test("listGosomJobs treats empty object response as empty job list", async () => {
  process.env.GOSOM_API_URL = "http://gosom.test";
  globalThis.fetch = async () =>
    new Response("{}", {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });

  const result = await listGosomJobs();

  assert.deepEqual(result, {
    state: "ready",
    jobs: [],
  });
});

test("listGosomJobs treats empty response body as empty job list", async () => {
  process.env.GOSOM_API_URL = "http://gosom.test";
  globalThis.fetch = async () => new Response("", { status: 200 });

  const result = await listGosomJobs();

  assert.deepEqual(result, {
    state: "ready",
    jobs: [],
  });
});
