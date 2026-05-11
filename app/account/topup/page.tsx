"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, Check, CheckCircle, XCircle, Clock, ArrowLeft, ExternalLink, Zap, TrendingUp, Shield } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function TopupPage() {
  const { lang } = useLang();
  const T = tr(lang).topupPage;

  const [balance,     setBalance]     = useState(0);
  const [requests,    setRequests]    = useState<any[]>([]);
  const [usdtAddress, setUsdtAddress] = useState("");
  const [usdtRate,    setUsdtRate]    = useState(25500);
  const [txHash,      setTxHash]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState<{ usdt: number; vnd: number } | null>(null);

  const load = useCallback(async () => {
    const [dataRes, settingsRes] = await Promise.all([
      fetch("/api/topup"),
      fetch("/api/settings"),
    ]);
    if (dataRes.ok)     { const d = await dataRes.json();    setBalance(d.balance ?? 0); setRequests(d.requests ?? []); }
    if (settingsRes.ok) { const s = await settingsRes.json(); setUsdtAddress(s.usdt_address ?? ""); setUsdtRate(parseFloat(s.usdt_rate) || 25500); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function copyAddress() {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    const res  = await fetch("/api/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tx_hash: txHash }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      const errMap: Record<string, string> = {
        missing_txhash:  T.errMissingTxhash,
        tx_already_used: T.errAlreadyUsed,
        tx_not_found:    T.errNotFound,
      };
      setError(errMap[data.error] ?? T.errGeneric);
      return;
    }
    setResult({ usdt: data.amount_usdt, vnd: data.amount_vnd });
    setTxHash("");
    load();
  }

  function StatusBadge({ status }: { status: string }) {
    if (status === "confirmed") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle className="h-3 w-3" /> {T.statusConfirmed}
      </span>
    );
    if (status === "rejected") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
        <XCircle className="h-3 w-3" /> {T.statusRejected}
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" /> {T.statusPending}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#0a2218] to-[#0f1923]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-teal-400/6 blur-3xl" />

        <div className="relative mx-auto max-w-lg px-6 pb-10 pt-8">
          <Link href="/account" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            {T.back}
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">{T.walletLabel}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{T.title}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{T.subtitle}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="mt-7 rounded-2xl bg-gradient-to-br from-emerald-600/90 to-teal-700/90 p-6 shadow-xl shadow-emerald-900/30 backdrop-blur ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">{T.availableBalance}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-white">{formatVND(balance)}</p>
                <p className="mt-1 text-xs text-emerald-200/60">{T.usdtRate.replace("{rate}", formatVND(usdtRate))}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <TrendingUp className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-lg space-y-4 px-6 py-7">

        {/* Step 1 — USDT address */}
        {usdtAddress ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">{T.step1Title}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
                <code className="flex-1 break-all text-sm font-mono text-gray-800 leading-relaxed select-all">{usdtAddress}</code>
                <button
                  onClick={copyAddress}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    copied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? T.copied : T.copy}
                </button>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-700">
                  {T.trc20Warning}
                  <span className="ml-1 text-amber-500">仅支持TRC20网络</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
            {T.noAddress}
          </div>
        )}

        {/* Step 2 — TX Hash */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">2</span>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">{T.step2Title}</p>
            <Zap className="ml-auto h-3.5 w-3.5 text-emerald-400" />
          </div>

          <div className="space-y-4 p-5">
            {result && (
              <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{T.successTitle}</p>
                  <p className="text-sm text-emerald-600">
                    +{result.usdt} USDT → <span className="font-bold">{formatVND(result.vnd)}</span>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{T.txHashLabel}</label>
                <input
                  required
                  value={txHash}
                  onChange={e => setTxHash(e.target.value.trim())}
                  placeholder={T.txHashPlaceholder}
                  className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-mono text-gray-800 placeholder-gray-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-xs text-gray-400">
                  {T.txHashHint}{" "}
                  <a href="https://tronscan.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-blue-500 hover:underline">
                    tronscan.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}{T.txHashHintOr}
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full font-semibold tracking-wide" loading={loading} disabled={!usdtAddress}>
                {T.confirmBtn}
              </Button>
            </form>
          </div>
        </div>

        {/* History */}
        {requests.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">{T.historyTitle}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.amount_usdt != null ? `+${r.amount_usdt} USDT` : T.bankTransfer} → {formatVND(r.amount_vnd)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                    {r.tx_hash && (
                      <a href={`https://tronscan.org/#/transaction/${r.tx_hash}`} target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <ExternalLink className="h-3 w-3" /> {T.viewTx}
                      </a>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
