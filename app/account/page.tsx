"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

export default function AccountPage() {
  const { lang } = useLang();
  const T = tr(lang).accountPage;

  const [balance, setBalance]       = useState<number>(0);
  const [topups, setTopups]         = useState<any[]>([]);
  const [orders, setOrders]         = useState<any[]>([]);

  const [fullName, setFullName]     = useState("");
  const [username, setUsername]     = useState("");
  const [supabase, setSupabase]     = useState<any>(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    async function loadAll() {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      setSupabase(sb);

      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setFullName(user.user_metadata?.full_name ?? "");
        setUsername(user.user_metadata?.username ?? "");
      }

      const [topupRes, { data: orderData }] = await Promise.all([
        fetch("/api/topup"),
        sb.from("orders")
          .select("id, order_code, amount, status, created_at, products(name)")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (topupRes.ok) {
        const d = await topupRes.json();
        setBalance(d.balance ?? 0);
        setTopups(d.requests ?? []);
      }
      setOrders(orderData ?? []);
    }
    loadAll();
  }, []);

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(""); setSaveSuccess("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, username: username.toLowerCase() },
    });
    if (error) setSaveError(error.message);
    else setSaveSuccess(T.saveSuccess);
    setSaving(false);
  }

  const confirmedTopups  = topups.filter(r => r.status === "confirmed");
  const totalTopup       = confirmedTopups.reduce((s, r) => s + (r.amount_usdt ?? 0), 0);
  const recentOrders     = orders.slice(0, 3);
  const recentTopups     = topups.filter(r => r.status !== "pending").slice(0, 3);

  return (
    <div className="space-y-5">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{T.balanceLabel}</p>
          <p className="mt-1 text-xl font-black text-emerald-600">
            {balance} <span className="text-xs font-bold text-gray-400">USDT</span>
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{T.statOrders}</p>
          <p className="mt-1 text-xl font-black text-blue-600">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{T.statTotalTopup}</p>
          <p className="mt-1 text-xl font-black text-violet-600">
            {totalTopup} <span className="text-xs font-bold text-gray-400">USDT</span>
          </p>
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-700">{T.recentOrdersTitle}</p>
          <Link href="/orders" className="text-xs font-semibold text-emerald-600 hover:underline">{T.viewAll}</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">{T.recentOrdersEmpty}</p>
            <Link href="/products" className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:underline">{T.shopNow}</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{(o.products as any)?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{o.order_code} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold text-gray-700">{o.amount} USDT</span>
                  {o.status === "delivered" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircle className="h-2.5 w-2.5" /> Delivered
                    </span>
                  )}
                  {o.status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      <Clock className="h-2.5 w-2.5" /> Pending
                    </span>
                  )}
                  {o.status === "cancelled" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      <XCircle className="h-2.5 w-2.5" /> Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent topups ── */}
      {recentTopups.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
            <p className="text-sm font-semibold text-gray-700">{T.topupHistoryTitle}</p>
            <Link href="/account/topup" className="text-xs font-semibold text-emerald-600 hover:underline">{T.viewAll}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTopups.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">+{r.amount_usdt ?? "?"} USDT</p>
                  <p className="mt-0.5 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  r.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                  r.status === "rejected"  ? "bg-red-100 text-red-600" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {r.status === "confirmed" ? <><CheckCircle className="h-3 w-3" /> Confirmed</> :
                   r.status === "rejected"  ? <>✗ Rejected</> :
                   <><Clock className="h-3 w-3" /> Pending</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Profile edit ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-700">{T.sectionInfo}</p>
        </div>
        <div className="p-5">
          {saveError   && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{saveError}</div>}
          {saveSuccess && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveSuccess}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{T.usernameLabel}</label>
              <input
                required value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <p className="text-xs text-gray-400">{T.usernameHint}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{T.fullNameLabel}</label>
              <input
                required value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <Button type="submit" className="w-full" loading={saving}>{T.saveBtn}</Button>
          </form>
        </div>
      </div>

    </div>
  );
}
