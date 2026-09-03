import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEvolutionConnectionStateUrl,
  buildEvolutionSendMediaPayload,
  buildEvolutionSendTextPayload,
  sendEvolutionMediaMessage,
} from "@/lib/evolution/client";

test("buildEvolutionSendTextPayload uses the flat Evolution v2 sendText shape", () => {
  assert.deepEqual(
    buildEvolutionSendTextPayload({
      number: "6281234567890",
      text: "Halo",
      delay: 1000,
    }),
    {
      number: "6281234567890",
      text: "Halo",
      delay: 1000,
      linkPreview: false,
    },
  );
});

test("buildEvolutionConnectionStateUrl targets the configured instance", () => {
  assert.equal(
    buildEvolutionConnectionStateUrl(
      "http://localhost:8086/",
      "google-maps-sender",
    ),
    "http://localhost:8086/instance/connectionState/google-maps-sender",
  );
});

test("buildEvolutionSendMediaPayload uses sendMedia image shape", () => {
  assert.deepEqual(
    buildEvolutionSendMediaPayload({
      number: "6281234567890",
      caption: "Halo",
      delay: 3000,
      fileName: "promo.png",
      mimeType: "image/png",
      media: "base64-image",
      mediaType: "image",
    }),
    {
      number: "6281234567890",
      mediatype: "image",
      mimetype: "image/png",
      caption: "Halo",
      media: "base64-image",
      fileName: "promo.png",
      delay: 3000,
    },
  );
});

test("buildEvolutionSendMediaPayload supports document attachments", () => {
  assert.deepEqual(
    buildEvolutionSendMediaPayload({
      number: "6281234567890",
      caption: "Halo",
      delay: 3000,
      fileName: "promo.gif",
      mimeType: "image/gif",
      media: "base64-gif",
      mediaType: "document",
    }),
    {
      number: "6281234567890",
      mediatype: "document",
      mimetype: "image/gif",
      caption: "Halo",
      media: "base64-gif",
      fileName: "promo.gif",
      delay: 3000,
    },
  );
});

test("sendEvolutionMediaMessage classifies request aborts as timeout", async (t) => {
  const originalEnv = {
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
    EVOLUTION_INSTANCE: process.env.EVOLUTION_INSTANCE,
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
  };

  process.env.EVOLUTION_API_URL = "http://localhost:8086";
  process.env.EVOLUTION_INSTANCE = "google-maps-sender";
  process.env.EVOLUTION_API_KEY = "test-key";

  t.after(() => {
    restoreEnvValue("EVOLUTION_API_URL", originalEnv.EVOLUTION_API_URL);
    restoreEnvValue("EVOLUTION_INSTANCE", originalEnv.EVOLUTION_INSTANCE);
    restoreEnvValue("EVOLUTION_API_KEY", originalEnv.EVOLUTION_API_KEY);
  });

  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException(
      "The operation was aborted due to timeout",
      "AbortError",
    );
  });

  const result = await sendEvolutionMediaMessage({
    number: "6281234567890",
    caption: "Halo",
    delay: 1000,
    fileName: "promo.jpg",
    mimeType: "image/jpeg",
    media: "base64-image",
    mediaType: "image",
  });

  assert.deepEqual(result, {
    state: "timeout",
    messageId: null,
  });
});

function restoreEnvValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
