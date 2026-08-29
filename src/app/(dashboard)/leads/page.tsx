import { LeadsFilterForm } from "@/components/leads/leads-filter-form";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import { LeadsTable } from "@/components/leads/leads-table";
import { EmptyState } from "@/components/ui/empty-state";
import { getLeadFilterOptions } from "@/lib/leads/filter-options";
import { listLeads, type LeadListFilters } from "@/lib/leads/list-leads";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const params = await searchParams;
  const filters = parseLeadFilters(params);
  const [result, filterOptions] = await Promise.all([
    listLeads(filters),
    getLeadFilterOptions(),
  ]);
  const deleteMessage = getDeleteMessage(params.delete, params.count);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span className="size-2 rounded-full bg-blue-600"></span>
            Database Lead Bisnis
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Semua Lead Terimpor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Kelola data bisnis hasil scraping, status pembersihan nomor seluler, dan kualifikasi pesan WhatsApp.
          </p>
        </div>
      </div>

      <LeadsFilterForm filters={filters} options={filterOptions} />

      {deleteMessage ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-2xs ${deleteMessage.className}`}
        >
          {deleteMessage.text}
        </div>
      ) : null}

      {result.state === "ready" && result.leads.length > 0 ? (
        <>
          <LeadsTable leads={result.leads} />
          <LeadsPagination
            filters={filters}
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
          />
        </>
      ) : (
        <EmptyState
          title={getEmptyTitle(result.state)}
          description={getEmptyDescription(result.state)}
        />
      )}
    </section>
  );
}


function parseLeadFilters(
  params: Awaited<PageProps<"/leads">["searchParams"]>,
): LeadListFilters {
  const query = getParam(params.q);
  const page = Number.parseInt(getParam(params.page) ?? "1", 10);
  const scrapeJobId = getParam(params.job);
  const category = getParam(params.category);
  const location = getParam(params.location);
  const phone = getParam(params.phone);
  const website = getParam(params.website);
  const cleaningStatus = getParam(params.cleaning);
  const whatsappStatus = getParam(params.wa);

  return {
    query,
    page: Number.isFinite(page) ? page : 1,
    scrapeJobId: isUuid(scrapeJobId) ? scrapeJobId : undefined,
    category,
    location,
    phone: phone === "mobile" || phone === "missing" ? phone : undefined,
    website: website === "has" || website === "missing" ? website : undefined,
    cleaningStatus:
      cleaningStatus === "clean" ||
      cleaningStatus === "incomplete" ||
      cleaningStatus === "duplicate"
        ? cleaningStatus
        : undefined,
    whatsappStatus:
      whatsappStatus === "eligible" ||
      whatsappStatus === "ineligible" ||
      whatsappStatus === "unchecked"
        ? whatsappStatus
        : undefined,
  };
}

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

function getEmptyTitle(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Database belum dikonfigurasi";
  }

  if (state === "error") {
    return "Lead belum bisa dimuat";
  }

  return "Belum ada lead";
}

function getEmptyDescription(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Isi DATABASE_URL di .env.local sebelum membaca data lead.";
  }

  if (state === "error") {
    return "Periksa koneksi database. Detail teknis hanya dicatat di log server.";
  }

  return "Impor CSV dari job scraping selesai untuk mulai mengisi tabel lead.";
}

function getDeleteMessage(
  state: string | string[] | undefined,
  count: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;
  const normalizedCount = Array.isArray(count) ? count[0] : count;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Lead berhasil dihapus.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (normalizedState === "bulk-ready") {
    return {
      text: `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} lead terpilih berhasil dihapus.`,
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (
    normalizedState === "invalid" ||
    normalizedState === "bulk-invalid" ||
    normalizedState === "missing-config"
  ) {
    return {
      text:
        normalizedState === "invalid" || normalizedState === "bulk-invalid"
          ? "Lead tidak valid, hapus dibatalkan."
          : "DATABASE_URL belum dikonfigurasi, hapus dibatalkan.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  return {
    text: "Lead belum bisa dihapus. Detail teknis dicatat di log server.",
    className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  };
}
