import Link from "next/link";

import type { CampaignLeadFilters } from "@/lib/campaigns/list-campaign-leads";
import type { LeadFilterOptions } from "@/lib/leads/filter-options";

type CampaignLeadFilterFormProps = {
  filters: CampaignLeadFilters;
  options: LeadFilterOptions;
};

export function CampaignLeadFilterForm({
  filters,
  options,
}: CampaignLeadFilterFormProps) {
  return (
    <form className="grid gap-3 rounded-xl border border-[#D9E0EA] bg-white p-4 shadow-sm md:grid-cols-6">
      <label className="md:col-span-2">
        <span className="block text-xs font-semibold text-[#475467]">Cari</span>
        <input
          name="q"
          defaultValue={filters.query ?? ""}
          placeholder="Nama, kategori, lokasi"
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        />
      </label>

      <label className="md:col-span-2">
        <span className="block text-xs font-semibold text-[#475467]">Job</span>
        <select
          name="job"
          defaultValue={filters.scrapeJobId ?? ""}
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        >
          <option value="">Semua job</option>
          {options.jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="block text-xs font-semibold text-[#475467]">
          Website
        </span>
        <select
          name="website"
          defaultValue={filters.website ?? ""}
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        >
          <option value="">Semua</option>
          <option value="has">Punya</option>
          <option value="missing">Tidak ada</option>
        </select>
      </label>

      <label>
        <span className="block text-xs font-semibold text-[#475467]">
          Campaign
        </span>
        <select
          name="campaignHistory"
          defaultValue={filters.campaignHistory ?? ""}
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        >
          <option value="">Semua</option>
          <option value="never">Belum pernah</option>
          <option value="ever">Pernah</option>
        </select>
      </label>

      <label className="md:col-span-2">
        <span className="block text-xs font-semibold text-[#475467]">
          Kategori
        </span>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        >
          <option value="">Semua kategori</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="md:col-span-2">
        <span className="block text-xs font-semibold text-[#475467]">
          Lokasi
        </span>
        <input
          name="location"
          defaultValue={filters.location ?? ""}
          placeholder="Kota atau area"
          className="mt-1 h-10 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
        />
      </label>

      <div className="flex items-end gap-2 md:col-span-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Terapkan
        </button>
        <Link
          href="/campaigns/new"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D9E0EA] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
