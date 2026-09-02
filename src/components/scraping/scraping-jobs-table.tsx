import {
  deleteGosomJobAction,
  importGosomJobAction,
} from "@/app/(dashboard)/scraping/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { DownloadIcon } from "@/components/ui/icons";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { createJakartaDateTimeFormatter } from "@/lib/datetime/timezone";
import type { ScrapingJobListItem } from "@/lib/scraping/list-jobs";

import { JobStatusBadge } from "./job-status-badge";

type ScrapingJobsTableProps = {
  jobs: ScrapingJobListItem[];
};

const dateFormatter = createJakartaDateTimeFormatter({
  dateStyle: "medium",
  timeStyle: "short",
});

export function ScrapingJobsTable({ jobs }: ScrapingJobsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Job Scraping Gosom
          </h3>
          <p className="text-xs text-slate-500">
            Total {jobs.length.toLocaleString("id-ID")} pekerjaan terdaftar
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Nama & ID Job
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Keyword Pencarian
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Tanggal Dibuat
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Radius
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Hasil
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-right">
                Aksi Pengelolaan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {jobs.map((job) => (
              <tr key={job.id} className="align-middle transition hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{job.name}</p>
                  <span className="mt-1 inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                    {job.externalJobId ?? "Belum dikirim ke Gosom"}
                  </span>
                  {job.errorMessage ? (
                    <p className="mt-1 max-w-xs text-[11px] text-rose-700">
                      {job.errorMessage}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  {job.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {job.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Tanpa keyword</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                  {formatJobDate(job.date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                  {formatRadius(job.radius)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                  {job.resultCount.toLocaleString("id-ID")}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {job.externalJobId && canImport(job.status) ? (
                      <a
                        href={`/api/gosom/jobs/${job.externalJobId}/download`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:bg-slate-100"
                      >
                        <DownloadIcon className="size-3.5 text-slate-500" />
                        CSV
                      </a>
                    ) : (
                      <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-400">
                        <DownloadIcon className="size-3.5" />
                        CSV
                      </span>
                    )}
                    <form action={importGosomJobAction}>
                      <input type="hidden" name="jobId" value={job.externalJobId ?? ""} />
                      <PendingSubmitButton
                        label="Impor"
                        pendingLabel="Mengimpor..."
                        disabled={!job.externalJobId || !canImport(job.status)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                      />
                    </form>
                    <form action={deleteGosomJobAction}>
                      <input type="hidden" name="scrapeJobId" value={job.id} />
                      <ConfirmSubmitButton
                        label="Hapus"
                        pendingLabel="Menghapus..."
                        confirmMessage={`Hapus job "${job.name}" dari antrean/Gosom dan database lokal? Lead hasil job ini juga akan terhapus jika sudah pernah diimpor.`}
                        icon="trash"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatJobDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date);
}

function formatRadius(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "-";
  }

  return `${value.toLocaleString("id-ID")} m`;
}

function canImport(status: string): boolean {
  return ["ok", "success", "completed"].includes(status.toLowerCase());
}
