import {
  saveEvolutionSettingsAction,
  testEvolutionTextAction,
} from "@/app/(dashboard)/settings/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getDefaultTestNumber } from "@/lib/evolution/test-send";
import { getSettingsStatus, type ConnectionStatus } from "@/lib/settings/status";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const params = await searchParams;
  const status = await getSettingsStatus();
  const testNumber = getDefaultTestNumber();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span className="size-2 rounded-full bg-blue-600"></span>
            Pengaturan Sistem & Koneksi API
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Status Layanan Terintegrasi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Validasi koneksi Gosom API, Evolution WhatsApp API, PostgreSQL, dan Redis.
          </p>
        </div>
        <a
          href="/settings"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
        >
          Refresh Status
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {status.services.map((service) => (
          <ServiceCard key={service.key} service={service} />
        ))}
      </div>

      <EvolutionSettingsForm
        settings={status.evolutionSettings}
        message={getEvolutionSettingsMessage(params.evolution)}
      />

      <TestMessageForm
        defaultNumber={testNumber}
        message={getTestMessage(params.test)}
      />

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Variabel Lingkungan (Environment Variables)
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {status.env.map((env) => (
            <div
              key={env.name}
              className="grid gap-2 px-5 py-3.5 sm:grid-cols-[240px_130px_1fr] sm:items-center text-xs sm:text-sm"
            >
              <p className="font-mono font-bold text-slate-800">
                {env.name}
              </p>
              <div>
                <StatusPill
                  state={env.status === "configured" ? "ready" : "missing-config"}
                />
              </div>
              <p className="break-all font-mono text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 border border-slate-200/70 inline-block w-fit">
                {env.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function EvolutionSettingsForm({
  settings,
  message,
}: {
  settings: {
    apiUrl: string;
    instance: string;
    apiKeyConfigured: boolean;
    apiKeySource: "database" | "environment" | "missing";
  };
  message: { text: string; className: string } | null;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
          <span className="size-2 rounded-full bg-blue-600"></span>
          Konfigurasi Evolution Aktif
        </div>
        <h2 className="mt-1 text-base font-bold text-slate-900">
          Instance WhatsApp Pengiriman
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Ubah instance dan API key tanpa rebuild container. Worker campaign membaca konfigurasi ini saat mengirim pesan.
        </p>
      </div>

      {message ? (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-2xs ${message.className}`}
        >
          {message.text}
        </div>
      ) : null}

      <form
        action={saveEvolutionSettingsAction}
        className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end"
      >
        <label>
          <span className="block text-xs font-semibold text-slate-700">
            URL Evolution API
          </span>
          <input
            name="apiUrl"
            required
            type="url"
            defaultValue={settings.apiUrl}
            placeholder="http://host.docker.internal:8086"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label>
          <span className="block text-xs font-semibold text-slate-700">
            Nama Instance
          </span>
          <input
            name="instance"
            required
            defaultValue={settings.instance}
            placeholder="wa-essentials-bot"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label>
          <span className="block text-xs font-semibold text-slate-700">
            API Key
          </span>
          <input
            name="apiKey"
            type="password"
            autoComplete="new-password"
            placeholder={
              settings.apiKeyConfigured
                ? `Sudah terisi dari ${translateApiKeySource(settings.apiKeySource)}`
                : "Masukkan API key"
            }
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <PendingSubmitButton
          label="Simpan"
          pendingLabel="Menyimpan..."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-2xs shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-wait disabled:bg-blue-500"
        />
      </form>
    </section>
  );
}

function TestMessageForm({
  defaultNumber,
  message,
}: {
  defaultNumber: string;
  message: { text: string; className: string } | null;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-600"></span>
          Pengujian Pengiriman Langsung
        </div>
        <h2 className="mt-1 text-base font-bold text-slate-900">
          Test Pengiriman Pesan WhatsApp (Evolution API)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Kirim pesan pengujian ke nomor sendiri untuk memastikan kredensial & koneksi Evolution API berjalan lancar.
        </p>
      </div>

      {message ? (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-2xs ${message.className}`}
        >
          {message.text}
        </div>
      ) : null}

      <form action={testEvolutionTextAction} className="grid gap-4 lg:grid-cols-[260px_1fr_auto] lg:items-end">
        <label>
          <span className="block text-xs font-semibold text-slate-700">
            Nomor WhatsApp Pengujian
          </span>
          <input
            name="number"
            required
            pattern="62[0-9]{8,15}"
            defaultValue={defaultNumber}
            placeholder="6281234567890"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label>
          <span className="block text-xs font-semibold text-slate-700">
            Isi Pesan Pengujian
          </span>
          <input
            name="text"
            required
            maxLength={1200}
            defaultValue="Test kirim pesan dari Lead Dashboard Admin."
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <PendingSubmitButton
          label="Kirim Pesan Test"
          pendingLabel="Mengirim..."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-2xs shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-wait disabled:bg-blue-500"
        />
      </form>
    </section>
  );
}

function ServiceCard({ service }: { service: ConnectionStatus }) {
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {service.label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {service.description}
          </p>
        </div>
        <StatusPill state={service.state} />
      </div>
      <p className="mt-4 text-xs font-mono font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-200/60 truncate">
        {service.detail}
      </p>
    </article>
  );
}

function StatusPill({ state }: { state: ConnectionStatus["state"] }) {
  const config =
    state === "ready"
      ? { className: "border-emerald-300 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", label: "Terkoneksi" }
      : state === "missing-config"
        ? { className: "border-amber-300 bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "Belum Lengkap" }
        : { className: "border-rose-300 bg-rose-50 text-rose-800", dot: "bg-rose-500", label: "Error" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function translateApiKeySource(
  source: "database" | "environment" | "missing",
): string {
  if (source === "database") {
    return "database";
  }

  if (source === "environment") {
    return ".env";
  }

  return "konfigurasi";
}

function getEvolutionSettingsMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "ready") {
    return {
      text: "Konfigurasi Evolution berhasil disimpan.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (normalizedState === "invalid") {
    return {
      text: "URL, instance, atau API key tidak valid.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  return {
    text: "Konfigurasi Evolution belum bisa disimpan. Detail teknis dicatat di log server.",
    className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
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
      text: "Pesan test berhasil dikirim.",
      className: "border-[#ABEFC6] bg-[#ECFDF3] text-[#047857]",
    };
  }

  if (normalizedState === "invalid") {
    return {
      text: "Nomor harus format 62xxxxxxxx dan pesan tidak boleh kosong.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  if (normalizedState === "missing-config") {
    return {
      text: "Konfigurasi Evolution API belum lengkap.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  return {
    text: "Pesan test belum bisa dikirim. Detail teknis dicatat di log server.",
    className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  };
}
