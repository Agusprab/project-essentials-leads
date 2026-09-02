import Link from "next/link";
import { z } from "zod";

import { EditCampaignForm } from "@/components/campaigns/edit-campaign-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getCampaign } from "@/lib/campaigns/get-campaign";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]/edit">) {
  const parsedParams = paramsSchema.safeParse(await params);
  const query = await searchParams;

  if (!parsedParams.success) {
    return (
      <EmptyState
        title="Campaign tidak valid"
        description="ID campaign tidak sesuai format yang digunakan aplikasi."
      />
    );
  }

  const result = await getCampaign(parsedParams.data.id);

  if (result.state !== "ready") {
    return (
      <EmptyState
        title="Campaign belum bisa diedit"
        description="Campaign tidak ditemukan atau database belum siap."
      />
    );
  }

  if (result.campaign.status !== "draft") {
    return (
      <EmptyState
        title="Campaign tidak bisa diedit"
        description="Hanya campaign draft yang bisa diedit agar riwayat pengiriman tetap auditable."
      />
    );
  }

  const message = getUpdateMessage(query.update);

  return (
    <section className="space-y-5">
      <Link
        href={`/campaigns/${result.campaign.id}`}
        className="text-sm font-semibold text-[#175CD3] hover:text-[#1849A9]"
      >
        Kembali ke detail campaign
      </Link>

      <div>
        <p className="text-sm font-medium text-[#2563eb]">Edit campaign</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#1D293B]">
          {result.campaign.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
          Ubah data draft sebelum campaign mulai dikirim.
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

      <EditCampaignForm campaign={result.campaign} />
    </section>
  );
}

function getUpdateMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  const messages: Record<string, string> = {
    invalid: "Data campaign belum lengkap atau melewati batas.",
    "invalid-delay": "Delay random tidak valid.",
    "missing-config": "DATABASE_URL belum dikonfigurasi.",
    "not-found": "Campaign tidak ditemukan.",
    "not-draft": "Campaign ini bukan draft, jadi tidak bisa diedit.",
  };

  return {
    text:
      messages[normalizedState] ??
      "Campaign belum bisa diperbarui. Detail teknis dicatat di log server.",
    className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
  };
}
