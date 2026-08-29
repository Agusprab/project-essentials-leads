import assert from "node:assert/strict";
import test from "node:test";

import { formatLeadAddress } from "@/lib/cleaning/address";
import { cleanGosomLeadRow } from "@/lib/cleaning/lead-cleaning";
import { parseCsv } from "@/lib/csv/parse";

test("parseCsv handles quoted commas and escaped quotes", () => {
  const rows = parseCsv('title,address\n"Toko ""A""","Jl. Satu, Bekasi"\n');

  assert.deepEqual(rows, [
    {
      title: 'Toko "A"',
      address: "Jl. Satu, Bekasi",
    },
  ]);
});

test("formatLeadAddress converts structured address JSON into readable text", () => {
  const address = formatLeadAddress(
    '{"borough":"Kebalen, Kecamatan Babelan","street":"Jl. Raya Babelan No.Km. 7, RW.8","city":"Kabupaten Bekasi","postal_code":"17121","state":"Jawa Barat","country":"ID"}',
  );

  assert.equal(
    address,
    "Jl. Raya Babelan No.Km. 7, RW.8, Kebalen, Kecamatan Babelan, Kabupaten Bekasi, Jawa Barat, 17121, ID",
  );
});

test("cleanGosomLeadRow normalizes Indonesian mobile, website, and emails", () => {
  const lead = cleanGosomLeadRow({
    input_id: "bekasi-resto",
    link: "https://maps.google.com/?cid=123",
    title: "  Warung Makan Contoh  ",
    category: "Restaurant",
    address: "Jl. Contoh",
    website: "www.Example.com/path",
    phone: "0812-3456-7890",
    emails: "SALES@EXAMPLE.COM, sales@example.com invalid",
    review_count: "120",
    review_rating: "4.6",
    latitude: "-6.2",
    longitude: "106.9",
    place_id: "place-1",
    cid: "123",
    status: "ok",
  });

  assert.equal(lead.businessName, "Warung Makan Contoh");
  assert.equal(lead.phoneNormalized, "6281234567890");
  assert.equal(lead.phoneType, "mobile");
  assert.equal(lead.website, "https://www.example.com/path");
  assert.equal(lead.websiteDomain, "example.com");
  assert.deepEqual(lead.emails, ["sales@example.com"]);
  assert.equal(lead.reviewCount, 120);
  assert.equal(lead.reviewRating, 4.6);
  assert.equal(lead.cleaningStatus, "clean");
  assert.equal(lead.whatsappStatus, "eligible");
});

test("cleanGosomLeadRow marks missing phone as incomplete and WhatsApp ineligible", () => {
  const lead = cleanGosomLeadRow({
    title: "Bisnis Tanpa Telepon",
    address: "Bekasi",
  });

  assert.equal(lead.phoneNormalized, null);
  assert.equal(lead.phoneType, null);
  assert.equal(lead.cleaningStatus, "incomplete");
  assert.equal(lead.whatsappStatus, "ineligible");
});
