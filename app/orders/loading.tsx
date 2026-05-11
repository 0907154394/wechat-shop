export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 pb-16 pt-12">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-9 w-56 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-72 animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-3">
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-9 w-24 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
