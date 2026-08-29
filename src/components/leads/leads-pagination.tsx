import type { LeadListFilters } from "@/lib/leads/list-leads";

type LeadsPaginationProps = {
  filters: LeadListFilters;
  page: number;
  pageSize: number;
  totalCount: number;
};

export function LeadsPagination({
  filters,
  page,
  pageSize,
  totalCount,
}: LeadsPaginationProps) {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const previousPage = Math.max(page - 1, 1);
  const nextPage = Math.min(page + 1, totalPages);

  return (
    <nav
      aria-label="Paginasi lead"
      className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white px-5 py-3.5 text-xs sm:text-sm text-slate-600 shadow-xs sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="font-medium text-slate-700">
        Menampilkan Halaman <span className="font-bold text-slate-900">{page.toLocaleString("id-ID")}</span> dari{" "}
        <span className="font-bold text-slate-900">{totalPages.toLocaleString("id-ID")}</span> (Total {totalCount.toLocaleString("id-ID")} lead)
      </p>
      <div className="flex gap-2">
        <a
          href={buildLeadHref(filters, previousPage)}
          aria-disabled={page <= 1 ? "true" : undefined}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Sebelumnya
        </a>
        <a
          href={buildLeadHref(filters, nextPage)}
          aria-disabled={page >= totalPages ? "true" : undefined}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Berikutnya
        </a>
      </div>
    </nav>
  );
}

function buildLeadHref(filters: LeadListFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.scrapeJobId) params.set("job", filters.scrapeJobId);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.phone) params.set("phone", filters.phone);
  if (filters.website) params.set("website", filters.website);
  if (filters.cleaningStatus) params.set("cleaning", filters.cleaningStatus);
  if (filters.whatsappStatus) params.set("wa", filters.whatsappStatus);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
}

