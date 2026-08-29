import assert from "node:assert/strict";
import test from "node:test";

import { renderCampaignMessage } from "@/lib/campaigns/message-template";

test("renderCampaignMessage replaces supported lead tokens", () => {
  const message = renderCampaignMessage(
    "Halo {businessName}, kategori {category}, lokasi {address}, website {website}, domain {websiteDomain}, email {email}, rating {rating}, review {reviewCount}, koordinat {latitude},{longitude}, maps {mapsUrl}, nomor {phone}.",
    {
      businessName: "Toko Bekasi",
      category: "Retail",
      address: "Jl. Ahmad Yani",
      website: "https://contoh.id",
      websiteDomain: "contoh.id",
      phoneNormalized: "6281234567890",
      emails: ["halo@contoh.id"],
      reviewRating: 4.7,
      reviewCount: 25,
      latitude: -6.2,
      longitude: 106.8,
      mapsUrl: "https://maps.google.com/?cid=123",
    },
  );

  assert.equal(
    message,
    "Halo Toko Bekasi, kategori Retail, lokasi Jl. Ahmad Yani, website https://contoh.id, domain contoh.id, email halo@contoh.id, rating 4.7, review 25, koordinat -6.2,106.8, maps https://maps.google.com/?cid=123, nomor 6281234567890.",
  );
});

test("renderCampaignMessage keeps unknown tokens unchanged", () => {
  const message = renderCampaignMessage("Halo {owner}", {
    businessName: "Toko Bekasi",
    category: null,
    address: null,
    website: null,
    websiteDomain: null,
    phoneNormalized: "6281234567890",
    emails: [],
    reviewRating: null,
    reviewCount: null,
    latitude: null,
    longitude: null,
    mapsUrl: null,
  });

  assert.equal(message, "Halo {owner}");
});
