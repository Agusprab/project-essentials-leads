"use client";

import { useEffect, useState, type ReactNode } from "react";

import { createCampaignAction } from "@/app/(dashboard)/campaigns/actions";
import { campaignTemplateTokens } from "@/lib/campaigns/message-template";
import type { CampaignLeadCandidate } from "@/lib/campaigns/list-campaign-leads";
import { createJakartaDateTimeFormatter } from "@/lib/datetime/timezone";

type CreateCampaignFormProps = {
  candidates: CampaignLeadCandidate[];
  filterSlot: ReactNode;
};

const formId = "create-campaign-form";
const draftStorageKey = "lead-dashboard:create-campaign-draft";
const templateStorageKey = "lead-dashboard:campaign-message-templates";
const defaultMessageTemplate =
  "Halo {businessName}, kami ingin menawarkan kerja sama untuk bisnis Anda. Apakah saat ini bisa kami kirimkan detail singkatnya?";
const lastCampaignDateFormatter = createJakartaDateTimeFormatter({
  dateStyle: "medium",
});

export function CreateCampaignForm({
  candidates,
  filterSlot,
}: CreateCampaignFormProps) {
  const defaultRecipientLimit = String(Math.min(Math.max(candidates.length, 1), 100));
  const [draft, setDraft] = useState<StoredDraft>(() =>
    getInitialDraft(defaultRecipientLimit),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    candidates.map((lead) => lead.id),
  );
  const [persistedMedia, setPersistedMedia] =
    useState<PersistedCampaignMedia | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<SavedMessageTemplate[]>(
    () => getInitialSavedTemplates(),
  );
  const {
    campaignName,
    recipientLimit,
    delayMode,
    fixedDelayValue,
    customFixedDelaySeconds,
    randomDelayMinSeconds,
    randomDelayMaxSeconds,
    messageTemplate,
  } = draft;
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
    setDraft((currentDraft) => {
      const currentTemplate = currentDraft.messageTemplate;
      const separator =
        currentTemplate.length === 0 || currentTemplate.endsWith(" ") ? "" : " ";

      return {
        ...currentDraft,
        messageTemplate: `${currentTemplate}${separator}{${token}}`,
      };
    });
  }

  useEffect(() => {
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify(draft),
    );
  }, [draft]);

  useEffect(() => {
    window.localStorage.setItem(
      templateStorageKey,
      JSON.stringify(savedTemplates),
    );
  }, [savedTemplates]);

  useEffect(() => {
    void loadPersistedMedia().then((media) => {
      setPersistedMedia(media);
    });
  }, []);

  async function handleMediaChange(file: File | undefined) {
    if (!file || file.size === 0) {
      await clearPersistedMedia();
      setPersistedMedia(null);
      return;
    }

    const media = await fileToPersistedMedia(file);
    await savePersistedMedia(media);
    setPersistedMedia(media);
  }

  async function removePersistedMedia() {
    await clearPersistedMedia();
    setPersistedMedia(null);
  }

  function saveCurrentTemplate() {
    const trimmedTemplate = messageTemplate.trim();

    if (trimmedTemplate.length < 10) {
      return;
    }

    const template = {
      id: globalThis.crypto.randomUUID(),
      name: campaignName.trim() || `Template ${savedTemplates.length + 1}`,
      message: trimmedTemplate,
      savedAt: new Date().toISOString(),
    };

    setSavedTemplates((currentTemplates) =>
      [
        template,
        ...currentTemplates.filter((item) => item.message !== trimmedTemplate),
      ].slice(0, 12),
    );
  }

  function loadSavedTemplate(template: SavedMessageTemplate) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      messageTemplate: template.message,
    }));
  }

  function deleteSavedTemplate(templateId: string) {
    setSavedTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId),
    );
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
              value={campaignName}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  campaignName: event.target.value,
                }))
              }
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
              value={recipientLimit}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  recipientLimit: event.target.value,
                }))
              }
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <label className="block">
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
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    messageTemplate: event.target.value,
                  }))
                }
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
          </div>

          <div className="rounded-lg border border-[#D9E0EA] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#344054]">
                Template tersimpan
              </h3>
              <button
                type="button"
                onClick={saveCurrentTemplate}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-[#2563eb] px-3 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Simpan
              </button>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {savedTemplates.length > 0 ? (
                savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border border-[#D9E0EA] bg-white p-2"
                  >
                    <button
                      type="button"
                      onClick={() => loadSavedTemplate(template)}
                      className="block w-full text-left text-xs font-semibold text-[#175CD3] hover:underline"
                    >
                      {template.name}
                    </button>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">
                      {template.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteSavedTemplate(template.id)}
                      className="mt-2 text-xs font-semibold text-[#B42318] hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-[#D9E0EA] bg-white px-3 py-5 text-center text-xs leading-5 text-[#667085]">
                  Belum ada template tersimpan.
                </p>
              )}
            </div>
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
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  delayMode:
                    event.target.value === "random" ? "random" : "fixed",
                }))
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
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      fixedDelayValue: event.target.value,
                    }))
                  }
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
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        customFixedDelaySeconds: event.target.value,
                      }))
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
                  value={randomDelayMinSeconds}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      randomDelayMinSeconds: event.target.value,
                    }))
                  }
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
                  value={randomDelayMaxSeconds}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      randomDelayMaxSeconds: event.target.value,
                    }))
                  }
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
          Attachment Campaign
        </h2>
        <label className="mt-4 block">
          <span className="block text-sm font-semibold text-[#344054]">
            Upload file
          </span>
          <input
            name="image"
            form={formId}
            type="file"
            onChange={(event) => {
              void handleMediaChange(event.target.files?.[0]);
            }}
            className="mt-1 block w-full rounded-lg border border-[#D9E0EA] bg-white px-3 py-2 text-sm text-[#1D293B] file:mr-3 file:rounded-md file:border-0 file:bg-[#EFF8FF] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#175CD3]"
          />
        </label>
        {persistedMedia ? (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#D9E0EA] bg-[#F8FAFC] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold text-[#344054]">
                {persistedMedia.fileName}
              </p>
              <p className="text-xs text-[#667085]">
                {formatFileSize(persistedMedia.size)} - {persistedMedia.mimeType}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void removePersistedMedia();
              }}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D9E0EA] bg-white px-3 text-xs font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
            >
              Hapus attachment
            </button>
          </div>
        ) : null}
        {persistedMedia ? (
          <>
            <input
              type="hidden"
              name="persistedMediaFileName"
              value={persistedMedia.fileName}
              form={formId}
            />
            <input
              type="hidden"
              name="persistedMediaMimeType"
              value={persistedMedia.mimeType}
              form={formId}
            />
            <input
              type="hidden"
              name="persistedMediaType"
              value={persistedMedia.mediaType}
              form={formId}
            />
            <input
              type="hidden"
              name="persistedMediaData"
              value={persistedMedia.data}
              form={formId}
            />
          </>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Maksimal 10 MB. Gambar umum dikirim sebagai gambar dengan caption,
          sedangkan GIF dan file lain dikirim sebagai dokumen.
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

function getInitialDraft(defaultRecipientLimit: string): StoredDraft {
  if (typeof window === "undefined") {
    return createDefaultDraft(defaultRecipientLimit);
  }

  const storedDraft = window.localStorage.getItem(draftStorageKey);

  if (!storedDraft) {
    return createDefaultDraft(defaultRecipientLimit);
  }

  return parseStoredDraft(storedDraft, defaultRecipientLimit) ?? createDefaultDraft(defaultRecipientLimit);
}

function createDefaultDraft(recipientLimit: string): StoredDraft {
  return {
    campaignName: "",
    recipientLimit,
    delayMode: "fixed",
    fixedDelayValue: "3000",
    customFixedDelaySeconds: "7",
    randomDelayMinSeconds: "5",
    randomDelayMaxSeconds: "15",
    messageTemplate: defaultMessageTemplate,
  };
}

type StoredDraft = {
  campaignName: string;
  recipientLimit: string;
  delayMode: "fixed" | "random";
  fixedDelayValue: string;
  customFixedDelaySeconds: string;
  randomDelayMinSeconds: string;
  randomDelayMaxSeconds: string;
  messageTemplate: string;
};

type PersistedCampaignMedia = {
  fileName: string;
  mimeType: string;
  mediaType: "image" | "video" | "audio" | "document";
  data: string;
  size: number;
};

type SavedMessageTemplate = {
  id: string;
  name: string;
  message: string;
  savedAt: string;
};

const campaignMediaDatabaseName = "lead-dashboard-campaign-media";
const campaignMediaStoreName = "attachments";
const campaignMediaKey = "new-campaign";

function getInitialSavedTemplates(): SavedMessageTemplate[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedTemplates = window.localStorage.getItem(templateStorageKey);

  if (!storedTemplates) {
    return [];
  }

  return parseSavedTemplates(storedTemplates);
}

function parseSavedTemplates(value: string): SavedMessageTemplate[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const template = item as Partial<Record<keyof SavedMessageTemplate, unknown>>;

      if (
        typeof template.id !== "string" ||
        typeof template.name !== "string" ||
        typeof template.message !== "string" ||
        typeof template.savedAt !== "string"
      ) {
        return [];
      }

      return [
        {
          id: template.id,
          name: template.name,
          message: template.message,
          savedAt: template.savedAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

function parseStoredDraft(
  value: string,
  defaultRecipientLimit: string,
): StoredDraft | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const draft = parsed as Partial<Record<keyof StoredDraft, unknown>>;

    return {
      campaignName: typeof draft.campaignName === "string" ? draft.campaignName : "",
      recipientLimit:
        typeof draft.recipientLimit === "string"
          ? draft.recipientLimit
          : defaultRecipientLimit,
      delayMode: draft.delayMode === "random" ? "random" : "fixed",
      fixedDelayValue:
        typeof draft.fixedDelayValue === "string" ? draft.fixedDelayValue : "3000",
      customFixedDelaySeconds:
        typeof draft.customFixedDelaySeconds === "string"
          ? draft.customFixedDelaySeconds
          : "7",
      randomDelayMinSeconds:
        typeof draft.randomDelayMinSeconds === "string"
          ? draft.randomDelayMinSeconds
          : "5",
      randomDelayMaxSeconds:
        typeof draft.randomDelayMaxSeconds === "string"
          ? draft.randomDelayMaxSeconds
          : "15",
      messageTemplate:
        typeof draft.messageTemplate === "string"
          ? draft.messageTemplate
          : defaultMessageTemplate,
    };
  } catch {
    return null;
  }
}

async function fileToPersistedMedia(file: File): Promise<PersistedCampaignMedia> {
  return {
    fileName: file.name || "campaign-attachment",
    mimeType: file.type || "application/octet-stream",
    mediaType: resolveMediaType(file.type),
    data: await readFileAsBase64(file),
    size: file.size,
  };
}

function resolveMediaType(
  mimeType: string,
): PersistedCampaignMedia["mediaType"] {
  if (mimeType === "image/gif") {
    return "document";
  }

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  ) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64Data = ""] = result.split(",");

      resolve(base64Data);
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("file_read_error"));
    });
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024)).toLocaleString("id-ID")} KB`;
  }

  return `${(size / 1024 / 1024).toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  })} MB`;
}

async function savePersistedMedia(media: PersistedCampaignMedia): Promise<void> {
  const database = await openCampaignMediaDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(campaignMediaStoreName, "readwrite");
    const store = transaction.objectStore(campaignMediaStoreName);
    const request = store.put(media, campaignMediaKey);

    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
  });
}

async function loadPersistedMedia(): Promise<PersistedCampaignMedia | null> {
  const database = await openCampaignMediaDatabase();

  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(campaignMediaStoreName, "readonly");
    const store = transaction.objectStore(campaignMediaStoreName);
    const request = store.get(campaignMediaKey);

    request.addEventListener("success", () => {
      resolve(parsePersistedMedia(request.result));
    });
    request.addEventListener("error", () => reject(request.error));
  });
}

async function clearPersistedMedia(): Promise<void> {
  const database = await openCampaignMediaDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(campaignMediaStoreName, "readwrite");
    const store = transaction.objectStore(campaignMediaStoreName);
    const request = store.delete(campaignMediaKey);

    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
  });
}

function openCampaignMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(campaignMediaDatabaseName, 1);

    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(campaignMediaStoreName);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function parsePersistedMedia(value: unknown): PersistedCampaignMedia | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const media = value as Partial<Record<keyof PersistedCampaignMedia, unknown>>;

  if (
    typeof media.fileName !== "string" ||
    typeof media.mimeType !== "string" ||
    typeof media.data !== "string" ||
    typeof media.size !== "number" ||
    !(
      media.mediaType === "image" ||
      media.mediaType === "video" ||
      media.mediaType === "audio" ||
      media.mediaType === "document"
    )
  ) {
    return null;
  }

  return {
    fileName: media.fileName,
    mimeType: media.mimeType,
    mediaType: media.mediaType,
    data: media.data,
    size: media.size,
  };
}
