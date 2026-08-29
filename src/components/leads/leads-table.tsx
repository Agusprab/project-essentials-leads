"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LeadListItem } from "@/lib/leads/list-leads";
import {
  bulkDeleteLeadsAction,
  deleteLeadAction,
} from "@/app/(dashboard)/leads/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

type LeadsTableProps = {
  leads: LeadListItem[];
};

export function LeadsTable({ leads }: LeadsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  function toggleLead(leadId: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(leadId)
        ? currentIds.filter((id) => id !== leadId)
        : [...currentIds, leadId],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : leads.map((lead) => lead.id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
      <form
        action={bulkDeleteLeadsAction}
        className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Aksi Massal:
          </span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {selectedIds.length.toLocaleString("id-ID")} Terpilih
          </span>
        </div>
        {selectedIds.map((leadId) => (
          <input key={leadId} type="hidden" name="leadIds" value={leadId} />
        ))}
        <ConfirmSubmitButton
          label="Hapus Terpilih"
          confirmMessage={`Hapus ${selectedIds.length.toLocaleString("id-ID")} lead terpilih dari database?`}
          icon="trash"
          disabled={selectedIds.length === 0}
        />
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  aria-label="Pilih semua lead di halaman ini"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Nama Bisnis & Kategori
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Alamat / Lokasi
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Nomor Telepon
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Domain Website
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Rating
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status Cleaning
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                WhatsApp Ready
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {leads.map((lead) => (
              <tr key={lead.id} className="align-middle transition hover:bg-slate-50/70">
                <td className="px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    aria-label={`Pilih ${lead.businessName}`}
                    checked={selectedSet.has(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-4 max-w-xs">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-bold text-slate-900 hover:text-blue-600 hover:underline transition"
                  >
                    {lead.businessName}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {lead.category ?? "Tanpa kategori"}
                  </p>
                </td>
                <td className="px-4 py-4 text-xs text-slate-600 max-w-xs truncate">
                  {lead.address ?? "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="font-semibold text-slate-900">{lead.phoneRaw ?? "-"}</p>
                  {lead.phoneNormalized && (
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {lead.phoneNormalized}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600">
                  {lead.websiteDomain ? (
                    <span className="font-mono text-xs text-blue-600">
                      {lead.websiteDomain}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {typeof lead.reviewRating === "number" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      ★ {lead.reviewRating.toLocaleString("id-ID")}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <LeadBadge status={lead.cleaningStatus} />
                  {lead.duplicateReason ? (
                    <p className="mt-1 text-[11px] text-rose-600 truncate max-w-[140px]">
                      {lead.duplicateReason}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <LeadBadge status={lead.whatsappStatus} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <form action={deleteLeadAction} className="inline-block">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:bg-slate-100"
                      >
                        Detail
                      </Link>
                      <ConfirmSubmitButton
                        label="Hapus"
                        confirmMessage={`Hapus lead "${lead.businessName}" dari database?`}
                        icon="trash"
                      />
                    </div>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const config =
    normalized === "eligible" || normalized === "clean"
      ? { className: "border-emerald-300 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" }
      : normalized === "duplicate" || normalized === "ineligible"
        ? { className: "border-rose-300 bg-rose-50 text-rose-800", dot: "bg-rose-500" }
        : { className: "border-amber-300 bg-amber-50 text-amber-800", dot: "bg-amber-500" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {translateStatus(status)}
    </span>
  );
}

function translateStatus(status: string): string {
  const labels: Record<string, string> = {
    clean: "Bersih",
    incomplete: "Tidak Lengkap",
    duplicate: "Duplikat",
    eligible: "Eligible WA",
    ineligible: "Tidak Eligible",
    unchecked: "Belum Dicek",
  };

  return labels[status] ?? status;
}

