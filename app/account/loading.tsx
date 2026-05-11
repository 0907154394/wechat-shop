export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-white/10" />
            <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-5 px-6 py-8">
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white shadow-sm" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
