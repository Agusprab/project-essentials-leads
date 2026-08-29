type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-[#B8C3D3] bg-white p-6">
      <h2 className="text-base font-semibold text-[#1D293B]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
        {description}
      </p>
    </section>
  );
}
