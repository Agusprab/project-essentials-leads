import { CreateScrapingJobForm } from "@/components/scraping/create-scraping-job-form";

export default function NewScrapingJobPage() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#2563eb]">Scraping Jobs</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1D293B]">
            Job Baru
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Pilih kota besar untuk mengisi titik lokasi otomatis, atau gunakan
            titik custom jika area target lebih spesifik.
          </p>
        </div>
        <a
          href="/scraping"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D9E0EA] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
        >
          Kembali
        </a>
      </div>

      <CreateScrapingJobForm />
    </section>
  );
}
