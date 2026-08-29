type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  disabled?: boolean;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  disabled = false,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[#2563eb]">{eyebrow}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#1D293B]">{title}</h1>
          {disabled ? (
            <span className="rounded-md border border-[#FEDF89] bg-[#FFFAEB] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
              Nonaktif
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[#D9E0EA] bg-white p-6 shadow-sm">
        <p className="max-w-2xl text-sm leading-6 text-[#667085]">
          {description}
        </p>
      </div>
    </section>
  );
}
