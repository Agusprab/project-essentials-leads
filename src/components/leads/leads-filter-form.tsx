import Link from "next/link";

import type { LeadFilterOptions } from "@/lib/leads/filter-options";
import type { LeadListFilters } from "@/lib/leads/list-leads";

type LeadsFilterFormProps = {
  filters: LeadListFilters;
  options: LeadFilterOptions;
};

export function LeadsFilterForm({ filters, options }: LeadsFilterFormProps) {
  return (
    <form className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-600"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Filter & Pencarian Lead Database
          </h3>
        </div>
        <Link
          href="/leads"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          Reset Filter
        </Link>
      </div>

      <div className="grid gap-3.5 md:grid-cols-6">
        <label className="md:col-span-3">
          <span className="block text-xs font-semibold text-slate-700">Cari Kata Kunci</span>
          <input
            name="q"
            defaultValue={filters.query ?? ""}
            placeholder="Nama bisnis, kategori, alamat, telepon..."
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="md:col-span-3">
          <span className="block text-xs font-semibold text-slate-700">Job Scraping Sumber</span>
          <select
            name="job"
            defaultValue={filters.scrapeJobId ?? ""}
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua Job</option>
            {options.jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="block text-xs font-semibold text-slate-700">Kategori Bisnis</span>
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua Kategori</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="block text-xs font-semibold text-slate-700">Lokasi / Kota</span>
          <input
            name="location"
            defaultValue={filters.location ?? ""}
            placeholder="Contoh: Jakarta, Bandung"
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="md:col-span-1">
          <span className="block text-xs font-semibold text-slate-700">Status Cleaning</span>
          <select
            name="cleaning"
            defaultValue={filters.cleaningStatus ?? ""}
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua</option>
            <option value="clean">Bersih</option>
            <option value="incomplete">Tidak lengkap</option>
            <option value="duplicate">Duplikat</option>
          </select>
        </label>

        <label className="md:col-span-1">
          <span className="block text-xs font-semibold text-slate-700">WhatsApp</span>
          <select
            name="wa"
            defaultValue={filters.whatsappStatus ?? ""}
            className="mt-1 h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua</option>
            <option value="eligible">Eligible</option>
            <option value="ineligible">Tidak eligible</option>
            <option value="unchecked">Belum dicek</option>
          </select>
        </label>

        <div className="flex items-center gap-2 pt-2 md:col-span-6 justify-end border-t border-slate-100 mt-1">
          <Link
            href="/leads"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            Reset
          </Link>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-2xs shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </form>
  );
}

