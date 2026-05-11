export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-14">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="h-9 w-64 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-80 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-40 animate-pulse bg-gray-100" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-gray-100" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
