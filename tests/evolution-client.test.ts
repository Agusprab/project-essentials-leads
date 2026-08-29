import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEvolutionConnectionStateUrl,
  buildEvolutionSendImagePayload,
  buildEvolutionSendTextPayload,
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

test("buildEvolutionSendImagePayload uses sendMedia image shape", () => {
  assert.deepEqual(
    buildEvolutionSendImagePayload({
      number: "6281234567890",
      caption: "Halo",
      delay: 3000,
      fileName: "promo.png",
      mimeType: "image/png",
      media: "base64-image",
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
