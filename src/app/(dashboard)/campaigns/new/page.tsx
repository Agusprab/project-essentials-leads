import Link from "next/link";

import { CampaignLeadFilterForm } from "@/components/campaigns/campaign-lead-filter-form";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildCampaignLeadFilterHref,
  listCampaignLeadCandidates,
  type CampaignLeadFilters,
} from "@/lib/campaigns/list-campaign-leads";
import { listCampaigns } from "@/lib/campaigns/list-campaigns";
import { getLeadFilterOptions } from "@/lib/leads/filter-options";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: PageProps<"/campaigns/new">) {
  const params = await searchParams;
  const filters = parseCampaignLeadFilters(params);
  const [result, filterOptions, candidates] = await Promise.all([
    listCampaigns(),
    getLeadFilterOptions(),
    listCampaignLeadCandidates(filters),
  ]);
  const message = getCreateMessage(params.create);

  if (result.state !== "ready" || candidates.state !== "ready") {
    return (
      <EmptyState
        title={
          result.state === "missing-config" ||
          candidates.state === "missing-config"
            ? "Database belum dikonfigurasi"
            : "Campaign belum bisa dibuat"
        }
        description={
          result.state === "missing-config" ||
          candidates.state === "missing-config"
            ? "Isi DATABASE_URL di .env.local sebelum membuat campaign."
            : "Periksa koneksi database. Detail teknis hanya dicatat di log server."
        }
      />
    );
  }

  return (
    <section className="space-y-5">
      <Link
        href="/campaigns"
        className="text-sm font-semibold text-[#175CD3] hover:text-[#1849A9]"
      >
        Kembali ke Campaigns
      </Link>

      <div>
        <p className="text-sm font-medium text-[#2563eb]">Campaign baru</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#1D293B]">
          Buat Draft Campaign
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
          Draft dibuat dari lead dengan status clean dan WhatsApp eligible.
        </p>
      </div>

      {message ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${message.className}`}
        >
          {message.text}
        </div>
      ) : null}

      <CreateCampaignForm
        key={buildCampaignLeadFilterHref(filters)}
        candidates={candidates.candidates}
        filterSlot={
          <CampaignLeadFilterForm filters={filters} options={filterOptions} />
        }
      />
    </section>
  );
}

function parseCampaignLeadFilters(
  params: Awaited<PageProps<"/campaigns/new">["searchParams"]>,
): CampaignLeadFilters {
  const scrapeJobId = getParam(params.job);
  const website = getParam(params.website);
  const campaignHistory = getParam(params.campaignHistory);

  return {
    query: getParam(params.q),
    scrapeJobId: isUuid(scrapeJobId) ? scrapeJobId : undefined,
    category: getParam(params.category),
    location: getParam(params.location),
    website: website === "has" || website === "missing" ? website : undefined,
    campaignHistory:
      campaignHistory === "never" || campaignHistory === "ever"
        ? campaignHistory
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

function getCreateMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "no-recipients") {
    return {
      text: "Belum ada lead yang clean dan eligible untuk WhatsApp.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  if (normalizedState === "invalid-delay") {
    return {
      text: "Delay random tidak valid. Minimal detik tidak boleh lebih besar dari maksimal detik.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  if (normalizedState === "invalid" || normalizedState === "missing-config") {
    return {
      text:
        normalizedState === "invalid"
          ? "Data campaign belum lengkap atau melewati batas."
          : "DATABASE_URL belum dikonfigurasi.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  return {
    text: "Draft campaign belum bisa dibuat. Detail teknis dicatat di log server.",
    className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  };
}
