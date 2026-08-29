import Link from "next/link";
import { z } from "zod";

import { EmptyState } from "@/components/ui/empty-state";
import { formatLeadAddress } from "@/lib/cleaning/address";
import { getLead } from "@/lib/leads/get-lead";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return (
      <EmptyState
        title="Lead tidak valid"
        description="ID lead tidak sesuai format yang digunakan aplikasi."
      />
    );
  }

  const result = await getLead(parsedParams.data.id);

  if (result.state !== "ready") {
    return (
      <EmptyState
        title={getEmptyTitle(result.state)}
        description={getEmptyDescription(result.state)}
      />
    );
  }

  const lead = result.lead;
  const address =
    formatLeadAddress(lead.completeAddress) ?? formatLeadAddress(lead.address);
  const whatsappReady = lead.whatsappStatus === "eligible";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          ← Kembali ke Lead Database
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
              {lead.category ?? "Kategori Belum Ditentukan"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {lead.businessName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              📍 {address ?? "Alamat belum tersedia"}
            </p>
          </div>

          <div className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-4.5 lg:w-[320px] shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kesiapan Follow-Up WhatsApp
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${whatsappReady ? "bg-emerald-500 animate-pulse-dot" : "bg-rose-500"}`} />
              <p
                className={`text-base font-bold ${
                  whatsappReady ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {whatsappReady ? "Siap Dihubungi" : "Belum Layak WhatsApp"}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {getEligibilityReason(lead.phoneType, lead.cleaningStatus)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-slate-100 pt-5">
          {lead.mapsUrl ? (
            <a
              href={lead.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-semibold !text-white shadow-2xs shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800"
            >
              Buka Google Maps
            </a>
          ) : null}
          {lead.website ? (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              Kunjungi Website
            </a>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
          <SectionHeader title="Detail Informasi Kontak & Alamat" />
          <div className="divide-y divide-slate-100">
            <InfoRow label="Telepon Raw" value={lead.phoneRaw} />
            <InfoRow label="Nomor WhatsApp" value={lead.phoneNormalized} />
            <InfoRow label="Jenis Nomor" value={translatePhoneType(lead.phoneType)} />
            <InfoRow
              label="Email Terdaftar"
              value={lead.emails.length > 0 ? lead.emails.join(", ") : null}
            />
            <InfoRow label="Domain Website" value={lead.websiteDomain ?? lead.website} />
            <InfoRow label="Alamat Lengkap" value={address} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <SectionHeader title="Status & Cleaning Data" />
            <div className="divide-y divide-slate-100">
              <InfoRow
                label="Rating Google"
                value={
                  typeof lead.reviewRating === "number"
                    ? `★ ${lead.reviewRating.toLocaleString("id-ID")}`
                    : null
                }
              />
              <InfoRow
                label="Jumlah Ulasan"
                value={lead.reviewCount?.toLocaleString("id-ID")}
              />
              <InfoRow label="Cleaning Data" value={translateStatus(lead.cleaningStatus)} />
              <InfoRow label="Kelayakan WA" value={translateStatus(lead.whatsappStatus)} />
              <InfoRow
                label="Alasan Duplikat"
                value={translateDuplicateReason(lead.duplicateReason)}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <SectionHeader title="Informasi Sumber Scraping" />
            <div className="divide-y divide-slate-100">
              <InfoRow label="Nama Job" value={lead.scrapeJobName} />
              <InfoRow
                label="Waktu Impor"
                value={dateFormatter.format(lead.createdAt)}
              />
              <InfoRow
                label="Update Terakhir"
                value={dateFormatter.format(lead.updatedAt)}
              />
            </div>
          </section>
        </aside>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <SectionHeader title="Histori Pengiriman Kampanye WhatsApp" />
        {lead.campaignHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full border-collapse text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Nama Kampanye
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status Pengiriman
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Percobaan
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Waktu Pengiriman
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lead.campaignHistory.map((history) => (
                  <tr key={`${history.campaignId}-${history.createdAt.toISOString()}`} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link
                        href={`/campaigns/${history.campaignId}`}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {history.campaignName}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Status kampanye: {translateCampaignStatus(history.campaignStatus)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={history.recipientStatus} />
                      {history.errorMessage ? (
                        <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-rose-600 font-medium">
                          {history.errorMessage}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {history.attemptCount.toLocaleString("id-ID")}x
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {history.sentAt
                        ? dateFormatter.format(history.sentAt)
                        : dateFormatter.format(history.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-xs sm:text-sm text-slate-500">
            Lead ini belum pernah didaftarkan ke kampanye WhatsApp.
          </p>
        )}
      </section>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h2>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[160px_1fr] sm:gap-4 items-center">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="break-words text-xs sm:text-sm font-medium text-slate-900">
        {value ?? <span className="text-slate-400 font-normal">-</span>}
      </dd>
    </div>
  );
}

function translateStatus(status: string): string {
  const labels: Record<string, string> = {
    clean: "Bersih",
    incomplete: "Tidak Lengkap",
    duplicate: "Duplikat",
    eligible: "Eligible WA",
    ineligible: "Tidak Eligible",
    unchecked: "Belum Dicek",
    pending: "Menunggu",
    queued: "Antre",
    sending: "Mengirim",
    sent: "Terkirim",
    failed: "Gagal",
    canceled: "Dibatalkan",
  };

  return labels[status] ?? status;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const config =
    normalized === "sent" || normalized === "eligible" || normalized === "clean"
      ? { className: "border-emerald-300 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" }
      : normalized === "failed" || normalized === "ineligible"
        ? { className: "border-rose-300 bg-rose-50 text-rose-800", dot: "bg-rose-500" }
        : normalized === "canceled"
          ? { className: "border-slate-300 bg-slate-100 text-slate-700", dot: "bg-slate-400" }
          : { className: "border-amber-300 bg-amber-50 text-amber-800", dot: "bg-amber-500" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {translateStatus(status)}
    </span>
  );
}


function translateCampaignStatus(status: string): string {
  return translateStatus(status).toLowerCase();
}

function translatePhoneType(value: string | null): string {
  const labels: Record<string, string> = {
    mobile: "Mobile",
    landline: "Telepon kantor",
    unknown: "Tidak diketahui",
  };

  return value ? labels[value] ?? value : "-";
}

function translateDuplicateReason(value: string | null): string | null {
  const labels: Record<string, string> = {
    place_id: "Place ID sama",
    cid: "CID sama",
    phone: "Nomor telepon sama",
    website_domain: "Domain website sama",
    business_name_address: "Nama dan alamat sama",
  };

  return value ? labels[value] ?? value : null;
}

function getEligibilityReason(
  phoneType: string | null,
  cleaningStatus: string,
): string {
  if (cleaningStatus === "duplicate") {
    return "Lead ini terdeteksi duplikat, jadi tidak masuk daftar kirim.";
  }

  if (phoneType !== "mobile") {
    return "Nomor bukan mobile atau belum tersedia.";
  }

  return "Nomor mobile tersedia dan data sudah cukup untuk follow-up.";
}

function getEmptyTitle(
  state: "missing-config" | "not-found" | "error",
): string {
  if (state === "missing-config") {
    return "Database belum dikonfigurasi";
  }

  if (state === "not-found") {
    return "Lead tidak ditemukan";
  }

  return "Detail lead belum bisa dimuat";
}

function getEmptyDescription(
  state: "missing-config" | "not-found" | "error",
): string {
  if (state === "missing-config") {
    return "Isi DATABASE_URL di .env.local sebelum membaca detail lead.";
  }

  if (state === "not-found") {
    return "Lead mungkin sudah dihapus atau ID yang dibuka tidak tersedia.";
  }

  return "Periksa koneksi database. Detail teknis hanya dicatat di log server.";
}
