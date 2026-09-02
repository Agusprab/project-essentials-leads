import { updateCampaignAction } from "@/app/(dashboard)/campaigns/actions";
import type { CampaignDetail } from "@/lib/campaigns/get-campaign";

type EditCampaignFormProps = {
  campaign: CampaignDetail;
};

export function EditCampaignForm({ campaign }: EditCampaignFormProps) {
  const fixedDelaySeconds = Math.round(campaign.delayMs / 1000);
  const randomMinSeconds = Math.round(campaign.delayMinMs / 1000);
  const randomMaxSeconds = Math.round(campaign.delayMaxMs / 1000);

  return (
    <form
      action={updateCampaignAction}
      className="space-y-5"
      encType="multipart/form-data"
    >
      <input type="hidden" name="campaignId" value={campaign.id} />

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Data campaign
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Nama campaign
            </span>
            <input
              name="name"
              required
              minLength={3}
              maxLength={120}
              defaultValue={campaign.name}
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            />
          </label>
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Maks. penerima
            </span>
            <input
              name="recipientLimit"
              type="number"
              min={1}
              max={500}
              defaultValue={campaign.recipientLimit}
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
            required
            minLength={10}
            maxLength={1200}
            rows={9}
            defaultValue={campaign.messageTemplate}
            className="mt-1 w-full resize-y rounded-lg border border-[#D9E0EA] px-3 py-3 text-sm leading-6 text-[#1D293B] outline-none transition focus:border-[#2563eb]"
          />
        </label>
      </section>

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Delay pengiriman
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Mode delay
            </span>
            <select
              name="delayMode"
              defaultValue={campaign.delayMode === "random" ? "random" : "fixed"}
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            >
              <option value="fixed">Tetap</option>
              <option value="random">Random</option>
            </select>
          </label>
          <label>
            <span className="block text-sm font-semibold text-[#344054]">
              Delay tetap
            </span>
            <select
              name="delayMs"
              defaultValue={String(campaign.delayMs)}
              className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] bg-white px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
            >
              <option value="1000">1 detik</option>
              <option value="3000">3 detik</option>
              <option value="5000">5 detik</option>
              <option value="10000">10 detik</option>
              <option value="15000">15 detik</option>
              <option value={String(campaign.delayMs)}>
                {fixedDelaySeconds} detik
              </option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="block text-sm font-semibold text-[#344054]">
                Min random
              </span>
              <input
                name="delayMinMs"
                type="number"
                min={1}
                max={30}
                defaultValue={randomMinSeconds}
                className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
              />
            </label>
            <label>
              <span className="block text-sm font-semibold text-[#344054]">
                Max random
              </span>
              <input
                name="delayMaxMs"
                type="number"
                min={1}
                max={60}
                defaultValue={randomMaxSeconds}
                className="mt-1 h-11 w-full rounded-lg border border-[#D9E0EA] px-3 text-sm text-[#1D293B] outline-none transition focus:border-[#2563eb]"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#101828]">
          Attachment
        </h2>
        <div className="mt-4 space-y-3">
          {campaign.hasMedia ? (
            <p className="rounded-lg border border-[#D9E0EA] bg-[#F8FAFC] px-3 py-2 text-sm text-[#344054]">
              Attachment saat ini: {campaign.mediaFileName ?? "tanpa nama"}
            </p>
          ) : null}
          <label className="block">
            <span className="block text-sm font-semibold text-[#344054]">
              Upload pengganti
            </span>
            <input
              name="image"
              type="file"
              className="mt-1 block w-full rounded-lg border border-[#D9E0EA] bg-white px-3 py-2 text-sm text-[#1D293B] file:mr-3 file:rounded-md file:border-0 file:bg-[#EFF8FF] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#175CD3]"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#344054]">
            <input
              type="radio"
              name="mediaMode"
              value="keep"
              defaultChecked
              className="size-4 border-[#D9E0EA]"
            />
            Pertahankan attachment saat ini
          </label>
          <label className="ml-0 inline-flex items-center gap-2 text-sm font-semibold text-[#344054] sm:ml-5">
            <input
              type="radio"
              name="mediaMode"
              value="remove"
              className="size-4 border-[#D9E0EA]"
            />
            Hapus attachment
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-[#D9E0EA] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#667085]">
          Edit hanya berlaku untuk draft. Pesan recipient pending akan diperbarui.
        </p>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          Simpan perubahan
        </button>
      </section>
    </form>
  );
}
