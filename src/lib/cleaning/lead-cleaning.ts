import type { CsvRow } from "@/lib/csv/parse";
import { formatLeadAddress } from "@/lib/cleaning/address";

export type CleanedLead = {
  sourceRowKey: string;
  inputId: string | null;
  placeId: string | null;
  cid: string | null;
  mapsUrl: string | null;
  businessName: string;
  category: string | null;
  address: string | null;
  completeAddress: string | null;
  website: string | null;
  websiteDomain: string | null;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  phoneType: "mobile" | "landline" | "unknown" | null;
  emails: string[];
  reviewCount: number | null;
  reviewRating: number | null;
  latitude: number | null;
  longitude: number | null;
  thumbnailUrl: string | null;
  mapsStatus: string | null;
  cleaningStatus: "clean" | "incomplete";
  whatsappStatus: "eligible" | "ineligible";
  rawData: Record<string, unknown>;
};

export function cleanGosomLeadRow(row: CsvRow): CleanedLead {
  const phoneRaw = nullableText(row.phone);
  const phone = normalizeIndonesianPhone(phoneRaw);
  const website = normalizeWebsite(row.website);
  const businessName = nullableText(row.title) ?? "Tanpa nama";
  const address = formatLeadAddress(nullableText(row.address));
  const completeAddress = formatLeadAddress(nullableText(row.complete_address));
  const sourceRowKey = buildSourceRowKey(row, businessName, address);
  const cleaningStatus = phone.normalized ? "clean" : "incomplete";
  const whatsappStatus = phone.type === "mobile" ? "eligible" : "ineligible";

  return {
    sourceRowKey,
    inputId: nullableText(row.input_id),
    placeId: nullableText(row.place_id),
    cid: nullableText(row.cid),
    mapsUrl: nullableText(row.link),
    businessName,
    category: nullableText(row.category),
    address,
    completeAddress,
    website: website.url,
    websiteDomain: website.domain,
    phoneRaw,
    phoneNormalized: phone.normalized,
    phoneType: phone.type,
    emails: normalizeEmails(row.emails),
    reviewCount: nullableInteger(row.review_count),
    reviewRating: nullableNumber(row.review_rating),
    latitude: nullableNumber(row.latitude),
    longitude: nullableNumber(row.longitude),
    thumbnailUrl: nullableText(row.thumbnail),
    mapsStatus: nullableText(row.status),
    cleaningStatus,
    whatsappStatus,
    rawData: row,
  };
}

function nullableText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableInteger(value: string | undefined): number | null {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableNumber(value: string | undefined): number | null {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIndonesianPhone(value: string | null): {
  normalized: string | null;
  type: CleanedLead["phoneType"];
} {
  if (!value) {
    return { normalized: null, type: null };
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return { normalized: null, type: "unknown" };
  }

  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("620")
      ? `62${digits.slice(3)}`
      : digits;

  if (/^628[1-9]\d{7,11}$/.test(normalized)) {
    return { normalized, type: "mobile" };
  }

  if (/^62[2-7]\d{6,11}$/.test(normalized)) {
    return { normalized, type: "landline" };
  }

  return { normalized, type: "unknown" };
}

function normalizeEmails(value: string | undefined): string[] {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const candidates = (value ?? "")
    .split(/[;,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .filter((email) => emailPattern.test(email));

  return Array.from(new Set(candidates));
}

function normalizeWebsite(value: string | undefined): {
  url: string | null;
  domain: string | null;
} {
  const text = nullableText(value);

  if (!text) {
    return { url: null, domain: null };
  }

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    const domain = url.hostname.toLowerCase().replace(/^www\./, "");

    return {
      url: url.toString(),
      domain,
    };
  } catch {
    return {
      url: text,
      domain: null,
    };
  }
}

function buildSourceRowKey(
  row: CsvRow,
  businessName: string,
  address: string | null,
): string {
  const stableParts = [
    row.place_id,
    row.cid,
    row.data_id,
    row.input_id,
    row.link,
    businessName,
    address,
  ].map((part) => (typeof part === "string" ? nullableText(part) : part) ?? "");

  return stableParts.join("|").toLowerCase();
}
