import Link from "next/link";
import { z } from "zod";

import {
  approveCampaignAction,
  cancelCampaignAction,
  duplicateCampaignAction,
  retryFailedCampaignRecipientsAction,
  testCampaignAction,
} from "@/app/(dashboard)/campaigns/actions";
import { CampaignDraftCleanup } from "@/components/campaigns/campaign-draft-cleanup";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCampaign,
  type CampaignRecipientStatusFilter,
} from "@/lib/campaigns/get-campaign";
import {
  getCampaignQueueStatus,
  type CampaignQueueStatus,
} from "@/lib/queue/campaigns";
import { getDefaultTestNumber } from "@/lib/evolution/test-send";
import { createJakartaDateTimeFormatter } from "@/lib/datetime/timezone";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const dateFormatter = createJakartaDateTimeFormatter({
  dateStyle: "medium",
  timeStyle: "short",
});

const recipientStatuses = [
  "pending",
  "queued",
  "sending",
  "sent",
  "failed",
  "canceled",
] as const satisfies CampaignRecipientStatusFilter[];

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[id]">) {
  const parsedParams = paramsSchema.safeParse(await params);
  const query = await searchParams;
  const recipientStatus = parseRecipientStatus(query.recipientStatus);

  if (!parsedParams.success) {
    return (
      <EmptyState
        title="Campaign tidak valid"
        description="ID campaign tidak sesuai format yang digunakan aplikasi."
      />
    );
  }

  const [result, queueStatus] = await Promise.all([
    getCampaign(parsedParams.data.id, { recipientStatus }),
    getCampaignQueueStatus(),
  ]);

  if (result.state !== "ready") {
    return (
      <EmptyState
        title={getEmptyTitle(result.state)}
        description={getEmptyDescription(result.state)}
      />
    );
  }

  const campaign = result.campaign;
  const createMessage = getCreateMessage(query.create, query.count);
  const approveMessage = getApproveMessage(query.approve, query.count);
  const controlMessage = getControlMessage(query.control, query.count);
  const testMessage = getTestMessage(query.test);
  const updateMessage = getUpdateMessage(query.update);
  const duplicateMessage = getDuplicateMessage(query.duplicate);
  const testNumber = getDefaultTestNumber();
  const canCancel = ["draft", "queued", "sending"].includes(campaign.status);
  const canRetry = campaign.failedRecipients > 0 && campaign.status !== "canceled";

  return (
    <section className="space-y-5">
      {query.create === "ready" ? <CampaignDraftCleanup /> : null}
      <Link
        href="/campaigns"
        className="text-sm font-semibold text-[#175CD3] hover:text-[#1849A9]"
      >
        Kembali ke Campaigns
      </Link>

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#2563eb]">Detail campaign</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#101828]">
              {campaign.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Dibuat {dateFormatter.format(campaign.createdAt)}.{" "}
              {formatDelay(campaign)}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              {campaign.hasMedia
                ? `Mengirim attachment${campaign.mediaFileName ? `: ${campaign.mediaFileName}` : ""}`
                : "Mengirim teks saja"}
            </p>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EEF2F6] pt-4">
          {campaign.status === "draft" ? (
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] px-3 text-xs font-semibold text-[#175CD3] transition hover:bg-[#D1E9FF]"
            >
              Edit campaign
            </Link>
          ) : null}
          <form action={duplicateCampaignAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <PendingSubmitButton
              label="Duplikasi"
              pendingLabel="Menduplikasi..."
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D9E0EA] bg-white px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-wait"
            />
          </form>
        </div>
        {campaign.status === "draft" ? (
          <form
            action={approveCampaignAction}
            className="mt-5 flex flex-col gap-3 border-t border-[#EEF2F6] pt-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <input type="hidden" name="campaignId" value={campaign.id} />
            <p className="text-sm text-[#667085]">
              {campaign.totalRecipients.toLocaleString("id-ID")} recipient akan
              masuk antrean worker.
            </p>
            <ConfirmSubmitButton
              label="Mulai pengiriman"
              pendingLabel="Menyiapkan..."
              confirmMessage={`Mulai pengiriman campaign "${campaign.name}" ke ${campaign.totalRecipients.toLocaleString("id-ID")} recipient?`}
              icon="send"
              variant="neutral"
              disabled={campaign.totalRecipients === 0}
            />
          </form>
        ) : null}
        {canCancel || canRetry ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {canRetry ? (
              <form action={retryFailedCampaignRecipientsAction}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <ConfirmSubmitButton
                  label="Retry gagal"
                  pendingLabel="Memproses..."
                  confirmMessage={`Masukkan ulang ${campaign.failedRecipients.toLocaleString("id-ID")} recipient gagal ke antrean?`}
                  icon="send"
                  variant="neutral"
                />
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelCampaignAction}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <ConfirmSubmitButton
                  label="Batalkan campaign"
                  pendingLabel="Membatalkan..."
                  confirmMessage={`Batalkan campaign "${campaign.name}"? Recipient yang belum terkirim akan ditandai batal.`}
                  icon="trash"
                />
              </form>
            ) : null}
          </div>
        ) : null}
      </section>

      {createMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${createMessage.className}`}
        >
          {createMessage.text}
        </div>
      ) : null}

      {approveMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${approveMessage.className}`}
        >
          {approveMessage.text}
        </div>
      ) : null}

      {controlMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${controlMessage.className}`}
        >
          {controlMessage.text}
        </div>
      ) : null}

      {testMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${testMessage.className}`}
        >
          {testMessage.text}
        </div>
      ) : null}

      {updateMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${updateMessage.className}`}
        >
          {updateMessage.text}
        </div>
      ) : null}

      {duplicateMessage ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${duplicateMessage.className}`}
        >
          {duplicateMessage.text}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <MetricCard label="Total" value={campaign.totalRecipients} />
        <MetricCard label="Menunggu" value={campaign.pendingRecipients} />
        <MetricCard label="Terkirim" value={campaign.sentRecipients} />
        <MetricCard label="Gagal" value={campaign.failedRecipients} />
      </div>

      <QueueStatusCard
        campaignId={campaign.id}
        recipientStatus={recipientStatus}
        status={queueStatus}
      />

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#101828]">
            Test Campaign
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#667085]">
            Kirim preview template campaign ke nomor sendiri sebelum mulai pengiriman.
          </p>
        </div>
        <form
          action={testCampaignAction}
          className="grid gap-4 sm:grid-cols-[260px_auto] sm:items-end"
        >
          <input type="hidden" name="campaignId" value={campaign.id} />
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Nomor test
            </span>
            <input
              name="number"
              required
              pattern="62[0-9]{8,15}"
              defaultValue={testNumber}
              placeholder="6281234567890"
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            />
          </label>
          <PendingSubmitButton
            label="Kirim test campaign"
            pendingLabel="Mengirim test..."
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-wait disabled:bg-[#2563eb]/80"
          />
        </form>
      </section>

      <section className="rounded-xl border border-[#D9E0EA] bg-white shadow-sm">
        <div className="border-b border-[#EEF2F6] px-5 py-4">
          <h2 className="text-base font-semibold text-[#101828]">
            Template Pesan
          </h2>
        </div>
        <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-[#344054]">
          {campaign.messageTemplate}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#D9E0EA] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#EEF2F6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#101828]">
              Recipient
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              {campaign.recipients.length.toLocaleString("id-ID")} recipient
              ditampilkan.
            </p>
          </div>
          <form className="flex items-center gap-2">
            <label
              htmlFor="recipientStatus"
              className="text-sm font-semibold text-[#475467]"
            >
              Status
            </label>
            <select
              id="recipientStatus"
              name="recipientStatus"
              defaultValue={recipientStatus ?? ""}
              className="h-9 rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Semua</option>
              {recipientStatuses.map((status) => (
                <option key={status} value={status}>
                  {translateRecipientStatus(status)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2563eb] px-3 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Terapkan
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-normal text-[#667085]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Lead
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Nomor
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Attempt
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Waktu
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Pesan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {campaign.recipients.map((recipient) => (
                <tr key={recipient.id} className="align-top">
                  <td className="px-4 py-4">
                    <Link
                      href={`/leads/${recipient.leadId}`}
                      className="font-semibold text-[#175CD3] hover:text-[#1849A9] hover:underline"
                    >
                      {recipient.businessName}
                    </Link>
                    <p className="mt-1 text-xs text-[#667085]">
                      {recipient.category ?? "Tanpa kategori"}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-[#475467]">
                    {recipient.phoneNormalized}
                  </td>
                  <td className="px-4 py-4">
                    <CampaignStatusBadge status={recipient.status} />
                    {recipient.errorMessage ? (
                      <p className="mt-2 max-w-[220px] text-xs leading-5 text-[#B42318]">
                        {recipient.errorMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-[#475467]">
                    {recipient.attemptCount.toLocaleString("id-ID")}x
                  </td>
                  <td className="px-4 py-4 text-[#475467]">
                    <RecipientTime recipient={recipient} />
                  </td>
                  <td className="max-w-[420px] px-4 py-4 text-[#475467]">
                    <p className="line-clamp-3 whitespace-pre-wrap leading-6">
                      {recipient.messageText}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#D9E0EA] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-[#667085]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#101828]">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function formatDelay(campaign: {
  delayMs: number;
  delayMode: string;
  delayMinMs: number;
  delayMaxMs: number;
}): string {
  if (campaign.delayMode === "random") {
    return `Delay random ${Math.round(campaign.delayMinMs / 1000).toLocaleString("id-ID")}-${Math.round(campaign.delayMaxMs / 1000).toLocaleString("id-ID")} detik.`;
  }

  return `Delay kirim ${Math.round(campaign.delayMs / 1000).toLocaleString("id-ID")} detik.`;
}

function QueueStatusCard({
  campaignId,
  recipientStatus,
  status,
}: {
  campaignId: string;
  recipientStatus: CampaignRecipientStatusFilter | undefined;
  status: CampaignQueueStatus;
}) {
  const href = recipientStatus
    ? `/campaigns/${campaignId}?recipientStatus=${recipientStatus}`
    : `/campaigns/${campaignId}`;

  return (
    <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#101828]">
            Status Antrean
          </h2>
          <p className="mt-1 text-sm text-[#667085]">
            Antrean worker pengiriman campaign.
          </p>
        </div>
        <a
          href={href}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D9E0EA] px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
        >
          Refresh
        </a>
      </div>
      {status.state === "ready" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Waiting" value={status.waiting} />
          <MetricCard label="Active" value={status.active} />
          <MetricCard label="Delayed" value={status.delayed} />
          <MetricCard label="Failed jobs" value={status.failed} />
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-[#B45309]">
          {status.state === "missing-config"
            ? "REDIS_URL belum dikonfigurasi."
            : "Status antrean belum bisa dibaca."}
        </p>
      )}
    </section>
  );
}

function RecipientTime({
  recipient,
}: {
  recipient: {
    queuedAt: Date | null;
    lastAttemptAt: Date | null;
    sentAt: Date | null;
  };
}) {
  if (recipient.sentAt) {
    return (
      <p>
        Terkirim
        <span className="mt-1 block text-xs text-[#667085]">
          {dateFormatter.format(recipient.sentAt)}
        </span>
      </p>
    );
  }

  if (recipient.lastAttemptAt) {
    return (
      <p>
        Dicoba
        <span className="mt-1 block text-xs text-[#667085]">
          {dateFormatter.format(recipient.lastAttemptAt)}
        </span>
      </p>
    );
  }

  if (recipient.queuedAt) {
    return (
      <p>
        Antre
        <span className="mt-1 block text-xs text-[#667085]">
          {dateFormatter.format(recipient.queuedAt)}
        </span>
      </p>
    );
  }

  return <p>-</p>;
}

function getCreateMessage(
  state: string | string[] | undefined,
  count: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;
  const normalizedCount = Array.isArray(count) ? count[0] : count;

  if (normalizedState !== "ready") {
    return null;
  }

  return {
    text: `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} recipient ditambahkan ke draft campaign.`,
    className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
  };
}

function getApproveMessage(
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
      text: `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} recipient masuk antrean pengiriman.`,
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  const messages: Record<string, string> = {
    "missing-config": "DATABASE_URL belum dikonfigurasi.",
    "missing-redis": "REDIS_URL belum dikonfigurasi, antrean belum bisa dibuat.",
    "not-found": "Campaign tidak ditemukan.",
    "not-draft": "Campaign ini bukan draft, jadi tidak bisa dimulai ulang dari tombol ini.",
    "no-recipients": "Campaign belum punya recipient untuk dikirim.",
    "queue-error": "Antrean Redis belum bisa diakses. Campaign dikembalikan ke draft.",
  };

  return {
    text:
      messages[normalizedState] ??
      "Campaign belum bisa dimulai. Detail teknis dicatat di log server.",
    className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
  };
}

function getControlMessage(
  state: string | string[] | undefined,
  count: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;
  const normalizedCount = Array.isArray(count) ? count[0] : count;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "cancel-ready") {
    return {
      text: `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} recipient belum terkirim ditandai batal.`,
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (normalizedState === "retry-ready") {
    return {
      text: `${Number(normalizedCount ?? 0).toLocaleString("id-ID")} recipient gagal masuk ulang ke antrean.`,
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  const messages: Record<string, string> = {
    "cancel-not-allowed": "Campaign tidak bisa dibatalkan pada status saat ini.",
    "cancel-not-found": "Campaign tidak ditemukan.",
    "cancel-missing-config": "DATABASE_URL belum dikonfigurasi.",
    "retry-missing-redis": "REDIS_URL belum dikonfigurasi, retry belum bisa dibuat.",
    "retry-not-allowed": "Campaign dibatalkan tidak bisa di-retry.",
    "retry-no-recipients": "Tidak ada recipient gagal untuk di-retry.",
    "retry-not-found": "Campaign tidak ditemukan.",
    "retry-queue-error": "Antrean Redis belum bisa diakses.",
  };

  return {
    text:
      messages[normalizedState] ??
      "Aksi campaign belum bisa diproses. Detail teknis dicatat di log server.",
    className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
  };
}

function getTestMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Test campaign berhasil dikirim ke nomor test.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  const messages: Record<string, string> = {
    invalid: "Nomor test harus format 62xxxxxxxx.",
    "missing-config": "Konfigurasi Evolution API belum lengkap.",
    "not-found": "Campaign tidak ditemukan.",
    error: "Evolution API belum bisa mengirim test campaign.",
  };

  return {
    text:
      messages[normalizedState] ??
      "Test campaign belum bisa dikirim. Detail teknis dicatat di log server.",
    className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
  };
}

function getUpdateMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (normalizedState !== "ready") {
    return null;
  }

  return {
    text: "Draft campaign berhasil diperbarui.",
    className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
  };
}

function getDuplicateMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Campaign berhasil diduplikasi sebagai draft baru.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  return {
    text: "Campaign belum bisa diduplikasi. Detail teknis dicatat di log server.",
    className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
  };
}

function getEmptyTitle(
  state: "missing-config" | "not-found" | "error",
): string {
  if (state === "missing-config") {
    return "Database belum dikonfigurasi";
  }

  if (state === "not-found") {
    return "Campaign tidak ditemukan";
  }

  return "Detail campaign belum bisa dimuat";
}

function getEmptyDescription(
  state: "missing-config" | "not-found" | "error",
): string {
  if (state === "missing-config") {
    return "Isi DATABASE_URL di .env.local sebelum membaca campaign.";
  }

  if (state === "not-found") {
    return "Campaign mungkin sudah dihapus atau ID yang dibuka tidak tersedia.";
  }

  return "Periksa koneksi database. Detail teknis hanya dicatat di log server.";
}

function parseRecipientStatus(
  value: string | string[] | undefined,
): CampaignRecipientStatusFilter | undefined {
  const status = Array.isArray(value) ? value[0] : value;

  return recipientStatuses.includes(status as CampaignRecipientStatusFilter)
    ? (status as CampaignRecipientStatusFilter)
    : undefined;
}

function translateRecipientStatus(status: CampaignRecipientStatusFilter): string {
  const labels: Record<CampaignRecipientStatusFilter, string> = {
    pending: "Pending",
    queued: "Antre",
    sending: "Mengirim",
    sent: "Terkirim",
    failed: "Gagal",
    canceled: "Dibatalkan",
  };

  return labels[status];
}
