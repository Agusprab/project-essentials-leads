import type { DashboardOverviewResult } from "@/lib/dashboard/overview";
import {
  CampaignIcon,
  LeadsIcon,
  SearchMapIcon,
} from "@/components/ui/icons";

const numberFormatter = new Intl.NumberFormat("id-ID");

type DashboardOverviewProps = {
  overview: DashboardOverviewResult;
};

export function DashboardOverview({ overview }: DashboardOverviewProps) {
  const { metrics } = overview;
  const totalLeads = metrics.totalLeads;

  const mobilePercentage =
    totalLeads > 0 ? Math.round((metrics.mobileLeads / totalLeads) * 100) : 0;
  const readyPercentage =
    totalLeads > 0 ? Math.round((metrics.campaignReadyLeads / totalLeads) * 100) : 0;
  const needsCleaningPercentage =
    totalLeads > 0
      ? Math.round((metrics.duplicateOrIncompleteLeads / totalLeads) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <section
        aria-label="Metrik utama dashboard"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* KPI 1: Total Leads */}
        <article className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Lead Database
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {numberFormatter.format(metrics.totalLeads)}
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
              <LeadsIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span>Terverifikasi Mobile:</span>
            <span className="font-semibold text-blue-700">{mobilePercentage}%</span>
          </div>
        </article>

        {/* KPI 2: Eligible WA */}
        <article className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lead Eligible WA
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
                {numberFormatter.format(metrics.campaignReadyLeads)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <div className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                <CampaignIcon className="size-4" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span>Kesiapan Kirim:</span>
            <span className="font-semibold text-emerald-700">{readyPercentage}% Siap</span>
          </div>
        </article>

        {/* KPI 3: Jobs Scraping */}
        <article className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Job Scraping Gosom
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {numberFormatter.format(metrics.totalScrapeJobs)}
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
              <SearchMapIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span>Job Berjalan:</span>
            <span className="font-semibold text-amber-700">
              {metrics.runningScrapeJobs > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  {metrics.runningScrapeJobs} Aktif
                </span>
              ) : (
                "0 Aktif"
              )}
            </span>
          </div>
        </article>

        {/* KPI 4: Needs Cleaning */}
        <article className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Perlu Cleaning / Duplikat
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-rose-700">
                {numberFormatter.format(metrics.duplicateOrIncompleteLeads)}
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
              <LeadsIcon className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span>Rasio Terpengaruh:</span>
            <span className="font-semibold text-rose-700">{needsCleaningPercentage}%</span>
          </div>
        </article>
      </section>

      {/* Visual Pipeline Funnel Card */}

    </div>
  );
}


