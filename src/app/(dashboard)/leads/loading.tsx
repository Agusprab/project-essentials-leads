export default function LeadsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-4 w-20 rounded bg-[#E4EAF2]" />
        <div className="mt-3 h-8 w-52 rounded bg-[#E4EAF2]" />
      </div>
      <div className="rounded-lg border border-[#D9E0EA] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 rounded bg-[#F2F5F9]" />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#D9E0EA] bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 rounded bg-[#F2F5F9]" />
          ))}
        </div>
      </div>
    </div>
  );
}
