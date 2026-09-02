const statusConfig = {
  queued: {
    label: "Antre",
    className: "border-slate-300 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    pulse: false,
  },
  pending: {
    label: "Menunggu",
    className: "border-slate-300 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    pulse: false,
  },
  submitting: {
    label: "Mengirim",
    className: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
    pulse: true,
  },
  running: {
    label: "Berjalan",
    className: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    pulse: true,
  },
  working: {
    label: "Berjalan",
    className: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    pulse: true,
  },
  ok: {
    label: "Selesai",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    pulse: false,
  },
  success: {
    label: "Selesai",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    pulse: false,
  },
  importing: {
    label: "Sedang impor",
    className: "border-violet-300 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
    pulse: true,
  },
  failed: {
    label: "Gagal",
    className: "border-rose-300 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
    pulse: false,
  },
  error: {
    label: "Gagal",
    className: "border-rose-300 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
    pulse: false,
  },
  imported: {
    label: "Diimpor",
    className: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-600",
    pulse: false,
  },
} as const;

type JobStatusBadgeProps = {
  status: string;
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ?? {
      label: status || "Tidak diketahui",
      className: "border-slate-300 bg-white text-slate-700",
      dot: "bg-slate-400",
      pulse: false,
    };

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
      <span className="sr-only">Status job: </span>
      {config.label}
    </span>
  );
}
