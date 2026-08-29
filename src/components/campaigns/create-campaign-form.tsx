"use client";

import { useState, type ReactNode } from "react";

import { createCampaignAction } from "@/app/(dashboard)/campaigns/actions";
import { campaignTemplateTokens } from "@/lib/campaigns/message-template";
import type { CampaignLeadCandidate } from "@/lib/campaigns/list-campaign-leads";

type CreateCampaignFormProps = {
  candidates: CampaignLeadCandidate[];
  filterSlot: ReactNode;
};

const formId = "create-campaign-form";
const defaultMessageTemplate =
  "Halo {businessName}, kami ingin menawarkan kerja sama untuk bisnis Anda. Apakah saat ini bisa kami kirimkan detail singkatnya?";
const lastCampaignDateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

export function CreateCampaignForm({
  candidates,
  filterSlot,
}: CreateCampaignFormProps) {
  const [delayMode, setDelayMode] = useState<"fixed" | "random">("fixed");
  const [fixedDelayValue, setFixedDelayValue] = useState("3000");
  const [customFixedDelaySeconds, setCustomFixedDelaySeconds] = useState("7");
  const [messageTemplate, setMessageTemplate] = useState(defaultMessageTemplate);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    candidates.map((lead) => lead.id),
  );
  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;
  const selectedSet = new Set(selectedIds);

  function toggleLead(leadId: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(leadId)
        ? currentIds.filter((id) => id !== leadId)
        : [...currentIds, leadId],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : candidates.map((lead) => lead.id));
  }

  function appendTemplateToken(token: string) {
    setMessageTemplate((currentTemplate) => {
      const separator =
        currentTemplate.length === 0 || currentTemplate.endsWith(" ") ? "" : " ";

      return `${currentTemplate}${separator}{${token}}`;
    });
  }

  return (
    <div className="space-y-5">
      <form id={formId} action={createCampaignAction} />

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Pengaturan Campaign
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Nama campaign
            </span>
            <input
              name="name"
              form={formId}
              required
              minLength={3}
              maxLength={120}
              placeholder="Promo pembukaan cabang Bekasi"
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            />
          </label>
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Maks. penerima
            </span>
            <input
              name="recipientLimit"
              form={formId}
              type="number"
              min={1}
              max={500}
              defaultValue={Math.min(Math.max(candidates.length, 1), 100)}
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="block text-sm font-semibold text-[#344054]">
            Template pesan
          </span>
          <textarea
            name="messageTemplate"
            form={formId}
            required
            minLength={10}
            maxLength={1200}
            rows={8}
            value={messageTemplate}
            onChange={(event) => setMessageTemplate(event.target.value)}
            className="mt-1 w-full resize-y rounded-lg border border-[#D9E0EA] px-3 py-3 text-sm leading-6 text-[#1D293B] outline-none transition focus:border-[#2563eb]"
          />
        </label>
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#667085]">
            Data lead yang bisa dipakai
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {campaignTemplateTokens.map((item) => (
              <button
                key={item.token}
                type="button"
                onClick={() => appendTemplateToken(item.token)}
                className="inline-flex min-h-8 items-center rounded-lg border border-[#D9E0EA] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#344054] transition hover:border-[#B2CCFF] hover:bg-[#EFF8FF] hover:text-[#175CD3]"
                title={`Tambahkan {${item.token}}`}
              >
                {item.label} {"{"}
                {item.token}
                {"}"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Delay Pengiriman
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Mode delay
            </span>
            <select
              name="delayMode"
              form={formId}
              value={delayMode}
              onChange={(event) =>
                setDelayMode(
                  event.target.value === "random" ? "random" : "fixed",
                )
              }
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            >
              <option value="fixed">Tetap</option>
              <option value="random">Random</option>
            </select>
          </label>

          {delayMode === "fixed" ? (
            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <label>
                <span className="block text-sm font-semibold text-[#344054]">
                  Preset
                </span>
                <select
                  value={fixedDelayValue}
                  onChange={(event) => setFixedDelayValue(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
                >
                  <option value="1000">1 detik</option>
                  <option value="3000">3 detik</option>
                  <option value="5000">5 detik</option>
                  <option value="10000">10 detik</option>
                  <option value="15000">15 detik</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              {fixedDelayValue === "custom" ? (
                <label>
                  <span className="block text-sm font-semibold text-[#344054]">
                    Custom detik
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={customFixedDelaySeconds}
                    onChange={(event) =>
                      setCustomFixedDelaySeconds(event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
                  />
                  <input
                    type="hidden"
                    name="delayMs"
                    value={resolveCustomDelayMs(customFixedDelaySeconds)}
                    form={formId}
                  />
                </label>
              ) : (
                <input
                  type="hidden"
                  name="delayMs"
                  value={fixedDelayValue}
                  form={formId}
                />
              )}
              <input type="hidden" name="delayMinMs" value="3" form={formId} />
              <input type="hidden" name="delayMaxMs" value="3" form={formId} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="block text-sm font-semibold text-[#344054]">
                  Minimal
                </span>
                <input
                  name="delayMinMs"
                  form={formId}
                  type="number"
                  min={1}
                  max={30}
                  defaultValue={5}
                  className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
                />
              </label>
              <label>
                <span className="block text-sm font-semibold text-[#344054]">
                  Maksimal
                </span>
                <input
                  name="delayMaxMs"
                  form={formId}
                  type="number"
                  min={1}
                  max={60}
                  defaultValue={15}
                  className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
                />
              </label>
              <input type="hidden" name="delayMs" value="3000" form={formId} />
            </div>
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Untuk random, nilai minimal dan maksimal diisi dalam detik.
        </p>
      </section>

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Gambar Campaign
        </h2>
        <label className="mt-4 block">
          <span className="block text-sm font-semibold text-[#344054]">
            Upload gambar
          </span>
          <input
            name="image"
            form={formId}
            type="file"
            accept="image/*"
            className="mt-1 block w-full rounded-lg border border-[#D9E0EA] bg-white px-3 py-2 text-sm text-[#1D293B] file:mr-3 file:rounded-md file:border-0 file:bg-[#EFF8FF] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#175CD3]"
          />
        </label>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Maksimal 2 MB. Jika gambar diisi, campaign akan dikirim sebagai gambar
          dengan caption pesan.
        </p>
      </section>

      {filterSlot}

      <section className="overflow-hidden rounded-xl border border-[#D9E0EA] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#EEF2F6] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#344054]">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="size-4 rounded border-[#D9E0EA]"
            />
            Pilih semua kandidat
          </label>
          <p className="text-sm text-[#667085]">
            {selectedIds.length.toLocaleString("id-ID")} dari{" "}
            {candidates.length.toLocaleString("id-ID")} lead dipilih
          </p>
        </div>

        <div className="max-h-[520px] overflow-auto">
          {candidates.length > 0 ? (
            <div className="divide-y divide-[#EEF2F6]">
              {candidates.map((lead) => (
                <label
                  key={lead.id}
                  className="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-[#F8FAFC] sm:grid-cols-[24px_1fr_170px_150px]"
                >
                  <input
                    type="checkbox"
                    name="leadIds"
                    form={formId}
                    value={lead.id}
                    checked={selectedSet.has(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    className="mt-1 size-4 rounded border-[#D9E0EA]"
                  />
                  <span>
                    <span className="block font-semibold text-[#101828]">
                      {lead.businessName}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[#667085]">
                      {lead.category ?? "Tanpa kategori"} -{" "}
                      {lead.address ?? "Alamat belum tersedia"}
                    </span>
                  </span>
                  <span className="text-sm text-[#475467]">
                    <span className="block font-mono">{lead.phoneNormalized}</span>
                    <span className="mt-1 block text-xs">
                      {lead.websiteDomain ?? "Tanpa website"}
                    </span>
                  </span>
                  <span className="text-sm text-[#475467]">
                    <span className="block font-semibold">
                      {lead.campaignCount.toLocaleString("id-ID")} campaign
                    </span>
                    <span className="mt-1 block text-xs">
                      {formatLastCampaignAt(lead.lastCampaignAt)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-[#667085]">
              Tidak ada kandidat lead untuk filter ini.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#667085]">
          Draft hanya dibuat dari lead yang dipilih dan tetap divalidasi ulang di
          server.
        </p>
        <button
          type="submit"
          form={formId}
          disabled={selectedIds.length === 0}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:pointer-events-none disabled:bg-[#D0D5DD]"
        >
          Buat Draft Campaign
        </button>
      </section>
    </div>
  );
}

function formatLastCampaignAt(value: string | null): string {
  if (!value) {
    return "Belum pernah";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Belum pernah";
  }

  return lastCampaignDateFormatter.format(date);
}

function resolveCustomDelayMs(value: string): number {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) {
    return 1000;
  }

  return Math.min(Math.max(1, seconds), 30) * 1000;
}
