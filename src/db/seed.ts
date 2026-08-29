import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { leads, scrapeJobs } from "@/db/schema";

config({
  path: ".env.local",
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum dikonfigurasi");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,
});
const db = drizzle(client);
const now = new Date();

const dummyScrapeJob = {
  provider: "google_maps",
  externalJobId: "dummy-seed-8",
  name: "Dummy Lead Seed 8",
  keywords: ["dummy lead", "testing campaign"],
  language: "id",
  latitude: "-6.2615",
  longitude: "106.8106",
  zoom: 15,
  radius: 10000,
  depth: 10,
  fastMode: false,
  extractEmail: false,
  extraReviews: false,
  maxTimeSeconds: 180,
  status: "imported",
  resultCount: 8,
  completedAt: now,
  importedAt: now,
  updatedAt: now,
} satisfies typeof scrapeJobs.$inferInsert;

const dummyLeads = [
  {
    sourceRowKey: "dummy-lead-001",
    inputId: "dummy-001",
    placeId: "dummy-place-001",
    cid: "dummy-cid-001",
    businessName: "Bengkel Mobil Selatan Dummy",
    category: "Bengkel Mobil",
    address: "Jl. Radio Dalam, Jakarta Selatan",
    completeAddress: "Jl. Radio Dalam, Kebayoran Baru, Jakarta Selatan, DKI Jakarta",
    website: "https://bengkel-selatan.example",
    websiteDomain: "bengkel-selatan.example",
    phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["halo@bengkel-selatan.example"],
    reviewCount: 128,
    reviewRating: 4.7,
    latitude: -6.2615,
    longitude: 106.8106,
  },
  {
    sourceRowKey: "dummy-lead-002",
    inputId: "dummy-002",
    placeId: "dummy-place-002",
    cid: "dummy-cid-002",
    businessName: "Klinik Gigi Bekasi Dummy",
    category: "Klinik Gigi",
    address: "Jl. Ahmad Yani, Bekasi",
    completeAddress: "Jl. Ahmad Yani, Bekasi Selatan, Kota Bekasi, Jawa Barat",
    website: "https://klinikgigi-bekasi.example",
    websiteDomain: "klinikgigi-bekasi.example",
     phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["kontak@klinikgigi-bekasi.example"],
    reviewCount: 84,
    reviewRating: 4.5,
    latitude: -6.2383,
    longitude: 106.9756,
  },
  {
    sourceRowKey: "dummy-lead-003",
    inputId: "dummy-003",
    placeId: "dummy-place-003",
    cid: "dummy-cid-003",
    businessName: "Laundry Tangerang Dummy",
    category: "Laundry",
    address: "Jl. Veteran, Tangerang",
    completeAddress: "Jl. Veteran, Kota Tangerang, Banten",
    website: "https://laundry-tangerang.example",
    websiteDomain: "laundry-tangerang.example",
      phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["admin@laundry-tangerang.example"],
    reviewCount: 63,
    reviewRating: 4.4,
    latitude: -6.1783,
    longitude: 106.6319,
  },
  {
    sourceRowKey: "dummy-lead-004",
    inputId: "dummy-004",
    placeId: "dummy-place-004",
    cid: "dummy-cid-004",
    businessName: "Toko Bangunan Depok Dummy",
    category: "Toko Bangunan",
    address: "Jl. Margonda Raya, Depok",
    completeAddress: "Jl. Margonda Raya, Pancoran Mas, Depok, Jawa Barat",
    website: "https://bangunan-depok.example",
    websiteDomain: "bangunan-depok.example",
     phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["sales@bangunan-depok.example"],
    reviewCount: 91,
    reviewRating: 4.3,
    latitude: -6.4025,
    longitude: 106.7942,
  },
  {
    sourceRowKey: "dummy-lead-005",
    inputId: "dummy-005",
    placeId: "dummy-place-005",
    cid: "dummy-cid-005",
    businessName: "Cafe Bandung Dummy",
    category: "Cafe",
    address: "Jl. Dago, Bandung",
    completeAddress: "Jl. Ir. H. Juanda, Coblong, Bandung, Jawa Barat",
    website: "https://cafe-bandung.example",
    websiteDomain: "cafe-bandung.example",
     phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["booking@cafe-bandung.example"],
    reviewCount: 246,
    reviewRating: 4.8,
    latitude: -6.9175,
    longitude: 107.6191,
  },
  {
    sourceRowKey: "dummy-lead-006",
    inputId: "dummy-006",
    placeId: "dummy-place-006",
    cid: "dummy-cid-006",
    businessName: "Salon Surabaya Dummy",
    category: "Salon",
    address: "Jl. Raya Darmo, Surabaya",
    completeAddress: "Jl. Raya Darmo, Wonokromo, Surabaya, Jawa Timur",
    website: "https://salon-surabaya.example",
    websiteDomain: "salon-surabaya.example",
    phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["info@salon-surabaya.example"],
    reviewCount: 75,
    reviewRating: 4.2,
    latitude: -7.2575,
    longitude: 112.7521,
  },
  {
    sourceRowKey: "dummy-lead-007",
    inputId: "dummy-007",
    placeId: "dummy-place-007",
    cid: "dummy-cid-007",
    businessName: "Kursus Bahasa Yogyakarta Dummy",
    category: "Kursus Bahasa",
    address: "Jl. Kaliurang, Yogyakarta",
    completeAddress: "Jl. Kaliurang, Sleman, DI Yogyakarta",
    website: "https://kursus-jogja.example",
    websiteDomain: "kursus-jogja.example",
      phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["hello@kursus-jogja.example"],
    reviewCount: 112,
    reviewRating: 4.6,
    latitude: -7.7956,
    longitude: 110.3695,
  },
  {
    sourceRowKey: "dummy-lead-008",
    inputId: "dummy-008",
    placeId: "dummy-place-008",
    cid: "dummy-cid-008",
    businessName: "Restoran Denpasar Dummy",
    category: "Restoran",
    address: "Jl. Teuku Umar, Denpasar",
    completeAddress: "Jl. Teuku Umar, Denpasar, Bali",
    website: "https://restoran-denpasar.example",
    websiteDomain: "restoran-denpasar.example",
    phoneRaw: "0812 9797 4732",
    phoneNormalized: "6281297974732",
    emails: ["reservasi@restoran-denpasar.example"],
    reviewCount: 169,
    reviewRating: 4.5,
    latitude: -8.6705,
    longitude: 115.2126,
  },
] satisfies Array<
  Omit<
    typeof leads.$inferInsert,
    | "scrapeJobId"
    | "source"
    | "phoneType"
    | "cleaningStatus"
    | "whatsappStatus"
    | "rawData"
    | "mapsStatus"
    | "updatedAt"
  >
>;

async function main() {
  const [insertedScrapeJob] = await db
    .insert(scrapeJobs)
    .values(dummyScrapeJob)
    .onConflictDoNothing({
      target: scrapeJobs.externalJobId,
    })
    .returning({
      id: scrapeJobs.id,
    });
  const [scrapeJob] = insertedScrapeJob
    ? [insertedScrapeJob]
    : await db
        .select({
          id: scrapeJobs.id,
        })
        .from(scrapeJobs)
        .where(eq(scrapeJobs.externalJobId, dummyScrapeJob.externalJobId))
        .limit(1);

  if (!scrapeJob) {
    throw new Error("dummy_scrape_job_not_found");
  }

  await db
    .insert(leads)
    .values(
      dummyLeads.map((lead) => ({
        ...lead,
        scrapeJobId: scrapeJob.id,
        source: "google_maps",
        phoneType: "mobile",
        cleaningStatus: "clean",
        whatsappStatus: "eligible",
        mapsStatus: "dummy",
        rawData: {
          seed: "dummy-seed-8",
          sourceRowKey: lead.sourceRowKey,
        },
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: [leads.scrapeJobId, leads.sourceRowKey],
      set: {
        cleaningStatus: "clean",
        whatsappStatus: "eligible",
        phoneType: "mobile",
        updatedAt: now,
      },
    });

  console.log("Seed dummy selesai: 1 scrape job dan 8 lead dummy siap campaign.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed dummy gagal", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
