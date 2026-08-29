type CampaignStatusBadgeProps = {
  status: string;
};

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const normalized = status.toLowerCase();
  const config =
    normalized === "draft" || normalized === "pending"
      ? { className: "border-blue-300 bg-blue-50 text-blue-800", dot: "bg-blue-600", pulse: false }
      : normalized === "completed" || normalized === "sent"
        ? { className: "border-emerald-300 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", pulse: false }
        : normalized === "sending" || normalized === "queued"
          ? { className: "border-amber-300 bg-amber-50 text-amber-800", dot: "bg-amber-500", pulse: true }
          : normalized === "failed"
            ? { className: "border-rose-300 bg-rose-50 text-rose-800", dot: "bg-rose-500", pulse: false }
            : { className: "border-slate-300 bg-slate-100 text-slate-700", dot: "bg-slate-400", pulse: false };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${config.className}`}
    >
      <span className="relative flex size-1.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex size-1.5 rounded-full ${config.dot}`} />
      </span>
      {translateStatus(status)}
    </span>
  );
}

function translateStatus(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    pending: "Menunggu",
    queued: "Antre",
    sending: "Mengirim",
    sent: "Terkirim",
    completed: "Selesai",
    failed: "Gagal",
    skipped: "Dilewati",
    canceled: "Dibatalkan",
  };

  return labels[status] ?? status;
}

