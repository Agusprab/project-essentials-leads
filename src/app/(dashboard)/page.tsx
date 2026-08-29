import Link from "next/link";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ScrapingJobsTable } from "@/components/scraping/scraping-jobs-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignIcon, LeadsIcon, PlusIcon, SearchMapIcon, SettingsIcon } from "@/components/ui/icons";
import { getDashboardOverview } from "@/lib/dashboard/overview";
import { listGosomJobs } from "@/lib/gosom/client";
import { getSettingsStatus } from "@/lib/settings/status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [overview, gosomJobsResult, settingsStatus] = await Promise.all([
    getDashboardOverview(),
    listGosomJobs(),
    getSettingsStatus(),
  ]);

  const recentJobs = gosomJobsResult.state === "ready" ? gosomJobsResult.jobs.slice(0, 4) : [];

  return (
    <div className="space-y-6">
      {/* Command Center Hero Header */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-72 rounded-full bg-gradient-to-br from-blue-500/10 via-sky-400/5 to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="size-1.5 rounded-full bg-blue-600 animate-pulse-dot"></span>
              Admin Command Center
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Lead & Scraping Manager
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pusat kendali scraping bisnis Google Maps, pembersihan kontak otomatis, kualifikasi WhatsApp, dan eksekusi pesan massal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/scraping/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4.5 text-xs font-semibold !text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800"
            >
              <PlusIcon className="size-4" />
              <span>Job Scraping Baru</span>
            </Link>
            <Link
              href="/leads"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <LeadsIcon className="size-4" />
              <span>Buka Lead Database</span>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards & Quality Funnel */}
      <DashboardOverview overview={overview} />

      {/* Split Main Operations Grid (8 cols + 4 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Jobs & Operational Table (8 Cols) */}
        <div className="space-y-6 lg:col-span-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Aktivitas Scraping Gosom Terkini
                </h2>
                <p className="text-xs text-slate-500">
                  Status pekerjaan pencarian lokasi & impor CSV paling terbaru
                </p>
              </div>
              <Link
                href="/scraping"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                Lihat Semua Job ({gosomJobsResult.state === "ready" ? gosomJobsResult.jobs.length : 0}) →
              </Link>
            </div>

            {recentJobs.length > 0 ? (
              <ScrapingJobsTable jobs={recentJobs} />
            ) : (
              <div className="rounded-xl border border-slate-200/90 bg-white p-6 text-center">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Belum ada pekerjaan scraping aktif di Gosom API.
                </p>
                <div className="mt-3">
                  <a
                    href="/scraping/new"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold !text-white shadow-2xs transition hover:bg-blue-700"
                  >
                    <PlusIcon className="size-3.5" />
                    <span>Buat Job Pertama</span>
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Workflow Guide & System Health (4 Cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* 3-Step Workflow Guide */}


          {/* Integration Status Mini Widget */}
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Integrasi Server
              </h2>
              <Link
                href="/settings"
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Detail →
              </Link>
            </div>

            <div className="space-y-2.5">
              {settingsStatus.services.map((srv) => (
                <div key={srv.key} className="flex items-center justify-between text-xs py-1">
                  <span className="font-semibold text-slate-700">{srv.label}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full border ${srv.state === "ready"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : srv.state === "missing-config"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${srv.state === "ready" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                    />
                    {srv.state === "ready" ? "Aktif" : "Belum Siap"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Akses Cepat Admin
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <Link
                href="/scraping"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition"
              >
                <SearchMapIcon className="size-4 text-blue-600" />
                <span>Job Scraping</span>
              </Link>
              <Link
                href="/leads"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition"
              >
                <LeadsIcon className="size-4 text-emerald-600" />
                <span>Data Lead</span>
              </Link>
              <Link
                href="/campaigns"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition"
              >
                <CampaignIcon className="size-4 text-purple-600" />
                <span>Kampanye</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition"
              >
                <SettingsIcon className="size-4 text-slate-600" />
                <span>Pengaturan</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {overview.state !== "ready" ? (
        <EmptyState
          title={
            overview.state === "missing-config"
              ? "Database belum dikonfigurasi"
              : "Ringkasan belum bisa dimuat"
          }
          description={
            overview.state === "missing-config"
              ? "Isi DATABASE_URL di .env.local untuk mulai membaca metrik dari PostgreSQL."
              : "Periksa koneksi database dan jalankan ulang halaman setelah layanan siap."
          }
        />
      ) : null}
    </div>
  );
}


