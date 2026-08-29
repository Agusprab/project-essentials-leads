import { ScrapingJobsTable } from "@/components/scraping/scraping-jobs-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, RefreshIcon } from "@/components/ui/icons";
import { listGosomJobs } from "@/lib/gosom/client";

import { syncGosomJobsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ScrapingPage({
  searchParams,
}: PageProps<"/scraping">) {
  const params = await searchParams;
  const result = await listGosomJobs();
  const syncMessage = getSyncMessage(params.sync, params.count);
  const importMessage = getImportMessage(params.import, params.count);
  const createMessage = getCreateMessage(params.create);
  const deleteMessage = getDeleteMessage(params.delete);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#2563eb]">Scraping Jobs</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1D293B]">
            Pekerjaan Scraping
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Pantau, sinkronkan, impor, dan hapus job scraping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={syncGosomJobsAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] px-4 text-sm font-semibold text-[#175CD3] transition hover:bg-[#D1E9FF]"
            >
              Sinkronkan
            </button>
          </form>
          <a
            href="/scraping"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D9E0EA] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
          >
            <RefreshIcon className="size-4" />
            Refresh
          </a>
          <a
            href="/scraping/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold !text-white shadow-sm transition hover:bg-[#1d4ed8]"
          >
            <PlusIcon className="size-4" />
            Job Baru
          </a>
        </div>
      </div>

      {syncMessage ? (
        <div
          role="status"
          className="rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] px-4 py-3 text-sm font-medium text-[#175CD3]"
        >
          {syncMessage}
        </div>
      ) : null}

      {createMessage ? (
        <StatusMessage tone={createMessage.tone}>{createMessage.text}</StatusMessage>
      ) : null}

      {importMessage ? (
        <StatusMessage tone="success">{importMessage}</StatusMessage>
      ) : null}

      {deleteMessage ? (
        <StatusMessage tone={deleteMessage.tone}>{deleteMessage.text}</StatusMessage>
      ) : null}

      {result.state === "ready" && result.jobs.length > 0 ? (
        <ScrapingJobsTable jobs={result.jobs} />
      ) : (
        <EmptyState
          title={getEmptyTitle(result.state)}
          description={getEmptyDescription(result.state)}
        />
      )}
    </section>
  );
}

function StatusMessage({
  children,
  tone,
}: {
  children: string;
  tone: "success" | "warning" | "error";
}) {
  const className = {
    success: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    warning: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    error: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  }[tone];

  return (
    <div role="status" className={`rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>
      {children}
    </div>
  );
}

function getEmptyTitle(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Gosom API belum dikonfigurasi";
  }

  if (state === "error") {
    return "Job belum bisa dimuat";
  }

  return "Belum ada job scraping";
}

function getEmptyDescription(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Isi GOSOM_API_URL di .env.local sebelum membaca daftar job.";
  }

  if (state === "error") {
    return "Periksa koneksi Gosom API. Detail teknis hanya dicatat di log server.";
  }

  return "Buat job melalui Gosom API, lalu gunakan halaman ini untuk memantau statusnya.";
}

function getSyncMessage(
  state: string | string[] | undefined,
  count: string | string[] | undefined,
): string | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;
  const normalizedCount = Array.isArray(count) ? count[0] : count;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} job berhasil disinkronkan ke database.`;
  }

  if (normalizedState === "missing-config") {
    return "DATABASE_URL belum dikonfigurasi, sinkronisasi belum dijalankan.";
  }

  if (normalizedState === "gosom-error") {
    return "Gosom API belum bisa dibaca, sinkronisasi dibatalkan.";
  }

  return "Database belum bisa ditulis, sinkronisasi dibatalkan.";
}

function getImportMessage(
  state: string | string[] | undefined,
  count: string | string[] | undefined,
): string | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;
  const normalizedCount = Array.isArray(count) ? count[0] : count;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} baris lead berhasil diimpor.`;
  }

  if (normalizedState === "invalid-job") {
    return "Job tidak valid, impor dibatalkan.";
  }

  if (normalizedState === "missing-config") {
    return "DATABASE_URL belum dikonfigurasi, impor dibatalkan.";
  }

  if (normalizedState === "job-not-found") {
    return "Job belum tersinkron ke database. Jalankan sinkronisasi lebih dulu.";
  }

  if (normalizedState === "download-not-found") {
    return "CSV job tidak ditemukan di Gosom API.";
  }

  if (normalizedState === "download-error") {
    return "CSV belum bisa diunduh dari Gosom API.";
  }

  return "Database belum bisa ditulis, impor dibatalkan.";
}

function getCreateMessage(
  state: string | string[] | undefined,
): { text: string; tone: "success" | "warning" | "error" } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Job berhasil dibuat dan daftar job sudah disegarkan.",
      tone: "success",
    };
  }

  if (normalizedState === "invalid") {
    return {
      text: "Form belum lengkap atau nilainya tidak valid.",
      tone: "warning",
    };
  }

  if (normalizedState === "missing-config") {
    return {
      text: "GOSOM_API_URL belum dikonfigurasi, job belum dibuat.",
      tone: "warning",
    };
  }

  return {
    text: "Job belum bisa dibuat. Detail teknis dicatat di log server.",
    tone: "error",
  };
}

function getDeleteMessage(
  state: string | string[] | undefined,
): { text: string; tone: "success" | "warning" | "error" } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready" || normalizedState === "not-found") {
    return {
      text:
        normalizedState === "ready"
          ? "Job berhasil dihapus."
          : "Job tidak ada di Gosom, data lokal yang terkait sudah dibersihkan jika tersedia.",
      tone: "success",
    };
  }

  if (normalizedState === "invalid-job") {
    return {
      text: "Job tidak valid, hapus dibatalkan.",
      tone: "warning",
    };
  }

  if (normalizedState === "missing-config") {
    return {
      text: "GOSOM_API_URL belum dikonfigurasi, hapus dibatalkan.",
      tone: "warning",
    };
  }

  return {
    text: "Job belum bisa dihapus. Detail teknis dicatat di log server.",
    tone: "error",
  };
}
