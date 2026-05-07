export default function Loading() {
  return (
    <div className="mt-7 grid gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[176px] animate-pulse rounded-[22px] border border-slate-200 bg-white shadow-card">
            <div className="m-7 h-12 w-12 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.42fr_1fr]">
        <div className="h-[410px] animate-pulse rounded-[22px] border border-slate-200 bg-white shadow-card" />
        <div className="h-[410px] animate-pulse rounded-[22px] border border-slate-200 bg-white shadow-card" />
      </div>
    </div>
  );
}
