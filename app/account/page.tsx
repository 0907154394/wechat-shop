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

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [supabase, setSupabase] = useState<any>(null);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      setSupabase(sb);
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setFullName(user.user_metadata?.full_name ?? "");
        setUsername(user.user_metadata?.username ?? "");
      }
    }
    async function loadHistory() {
      const res = await fetch("/api/topup");
      if (res.ok) {
        const d = await res.json();
        setTopupHistory((d.requests ?? []).filter((r: any) => r.status !== "pending").slice(0, 5));
      }
    }
    load();
    loadHistory();
  }, []);

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, username: username.toLowerCase() },
    });
    if (error) setError(error.message);
    else setSuccess(T.saveSuccess);
    setLoading(false);
  }

  return (
    <div className="space-y-5">

      {/* Topup history */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-700">Topup History</p>
          <Link href="/account/topup" className="text-xs font-semibold text-emerald-600 hover:underline">+ New topup</Link>
        </div>
        {topupHistory.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No topup history yet.</p>
            <Link href="/account/topup" className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:underline">Topup now →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topupHistory.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">+{r.amount_usdt ?? "?"} USDT</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                {r.status === "confirmed" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle className="h-3 w-3" /> Confirmed
                  </span>
                )}
                {r.status === "rejected" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
                    <XCircle className="h-3 w-3" /> Rejected
                  </span>
                )}
                {r.status !== "confirmed" && r.status !== "rejected" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile edit */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-700">{T.sectionInfo}</p>
        </div>
        <div className="p-5">
          {error   && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
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
            <Button type="submit" className="w-full" loading={loading}>{T.saveBtn}</Button>
          </form>
        </div>
      </div>

    </div>
  );
}
