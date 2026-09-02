import assert from "node:assert/strict";
import test from "node:test";

import { createGosomJob, listGosomJobs } from "@/lib/gosom/client";

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

test("createGosomJob extracts a returned job id", async () => {
  process.env.GOSOM_API_URL = "http://gosom.test";
  globalThis.fetch = async () =>
    Response.json({
      id: "gosom-created-1",
    });

  const result = await createGosomJob({
    name: "Queue Test",
    keywords: ["bengkel"],
    lang: "id",
    lat: "-6.2",
    lon: "106.8",
    zoom: 15,
    radius: 10000,
    depth: 10,
    fast_mode: false,
    email: false,
    extra_reviews: false,
    max_time: 180,
  });

  assert.equal(result.state, "ready");
  assert.equal(result.jobId, "gosom-created-1");
});
