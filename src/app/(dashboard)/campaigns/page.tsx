import Link from "next/link";

import { CampaignsTable } from "@/components/campaigns/campaigns-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { listCampaigns } from "@/lib/campaigns/list-campaigns";

export const dynamic = "force-dynamic";

export default async function CampaignsPage({
  searchParams,
}: PageProps<"/campaigns">) {
  const params = await searchParams;
  const result = await listCampaigns();
  const deleteMessage = getDeleteMessage(params.delete);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#2563eb]">Campaigns</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1D293B]">
            Kampanye WhatsApp
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Siapkan draft kampanye dari lead yang sudah bersih dan eligible.
          </p>
        </div>

        <Link
          href="/campaigns/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold !text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          <PlusIcon className="size-4" />
          Campaign baru
        </Link>
      </div>

      {result.state === "ready" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Lead eligible"
            value={result.eligibleLeadCount.toLocaleString("id-ID")}
          />
          <MetricCard
            label="Campaign aktif"
            value={result.campaigns.length.toLocaleString("id-ID")}
          />
          <MetricCard
            label="Mode"
            value="Draft"
            description="Pengiriman belum diaktifkan otomatis"
          />
        </div>
      ) : null}

      {deleteMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${deleteMessage.className}`}
        >
          {deleteMessage.text}
        </div>
      ) : null}

      {result.state === "ready" && result.campaigns.length > 0 ? (
        <CampaignsTable campaigns={result.campaigns} />
      ) : (
        <EmptyState
          title={getEmptyTitle(result.state)}
          description={getEmptyDescription(result.state)}
        />
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-[#D9E0EA] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-[#667085]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#101828]">{value}</p>
      {description ? (
        <p className="mt-1 text-xs text-[#667085]">{description}</p>
      ) : null}
    </div>
  );
}

function getEmptyTitle(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Database belum dikonfigurasi";
  }

  if (state === "error") {
    return "Campaign belum bisa dimuat";
  }

  return "Belum ada campaign";
}

function getEmptyDescription(state: "ready" | "missing-config" | "error"): string {
  if (state === "missing-config") {
    return "Isi DATABASE_URL di .env.local sebelum membuat campaign.";
  }

  if (state === "error") {
    return "Periksa koneksi database. Detail teknis hanya dicatat di log server.";
  }

  return "Buat draft campaign dari lead eligible sebelum mengaktifkan pengiriman.";
}

function getDeleteMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Campaign berhasil dihapus.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (normalizedState === "invalid" || normalizedState === "missing-config") {
    return {
      text:
        normalizedState === "invalid"
          ? "Campaign tidak valid, hapus dibatalkan."
          : "DATABASE_URL belum dikonfigurasi, hapus dibatalkan.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  return {
    text: "Campaign belum bisa dihapus. Detail teknis dicatat di log server.",
    className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  };
}
