import Link from "next/link";

import { deleteCampaignAction } from "@/app/(dashboard)/campaigns/actions";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { DownloadIcon } from "@/components/ui/icons";
import { createJakartaDateTimeFormatter } from "@/lib/datetime/timezone";
import type { CampaignListItem } from "@/lib/campaigns/list-campaigns";

const dateFormatter = createJakartaDateTimeFormatter({
  dateStyle: "medium",
  timeStyle: "short",
});

type CampaignsTableProps = {
  campaigns: CampaignListItem[];
};

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Kampanye WhatsApp
          </h3>
          <p className="text-xs text-slate-500">
            Total {campaigns.length.toLocaleString("id-ID")} kampanye terdaftar
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Nama Kampanye
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Target Penerima
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Progress Pengiriman
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Waktu Dibuat
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-right">
                Aksi Pengelolaan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {campaigns.map((campaign) => {
              const progressPercentage =
                campaign.totalRecipients > 0
                  ? Math.round((campaign.sentRecipients / campaign.totalRecipients) * 100)
                  : 0;

              return (
                <tr key={campaign.id} className="align-middle transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 max-w-xs">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Limit {campaign.recipientLimit.toLocaleString("id-ID")} lead
                      {campaign.mediaType ? " • Ada attachment" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-900">
                    {campaign.totalRecipients.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap min-w-[200px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">
                        {campaign.sentRecipients.toLocaleString("id-ID")} Terkirim
                      </span>
                      <span className="text-slate-500">{progressPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {campaign.pendingRecipients.toLocaleString("id-ID")} pending •{" "}
                      {campaign.failedRecipients.toLocaleString("id-ID")} gagal
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                    {dateFormatter.format(campaign.createdAt)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <form action={deleteCampaignAction} className="inline-block">
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:bg-slate-100"
                        >
                          Detail
                        </Link>
                        <a
                          href={`/api/campaigns/${campaign.id}/report`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100 active:bg-blue-200"
                        >
                          <DownloadIcon className="size-3.5" />
                          CSV
                        </a>
                        <ConfirmSubmitButton
                          label="Hapus"
                          confirmMessage={`Hapus campaign "${campaign.name}" beserta daftar recipient-nya?`}
                          icon="trash"
                        />
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
