"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Copy, CheckCircle, Clock, ArrowLeft, RefreshCw, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

const PRESETS = [
  { usdt: 10,  label: "10 USDT" },
  { usdt: 20,  label: "20 USDT" },
  { usdt: 50,  label: "50 USDT" },
  { usdt: 100, label: "100 USDT" },
];

type Phase = "idle" | "pending" | "confirmed";

interface PendingTopup {
  id: string;
  expected_usdt: number;
  usdt_address: string;
}

function useCountdown(minutes: number) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return { m, s, expired: seconds <= 0 };
}

function PendingPanel({ topup, onConfirmed }: {
  topup: PendingTopup;
  onConfirmed: (usdt: number) => void;
}) {
  const [copied, setCopied] = useState<"addr" | "amt" | null>(null);
  const [checking, setChecking] = useState(false);
  const { m, s, expired } = useCountdown(30);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(topup.usdt_address)}`;

  function copy(text: string, type: "addr" | "amt") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2500);
  }

  const checkPayment = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/topup/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: topup.id }),
      });
      const data = await res.json();
      if (data.confirmed) onConfirmed(data.amount_usdt);
    } catch {}
    setChecking(false);
  }, [topup.id, onConfirmed, checking]);

  // Auto-poll every 15 seconds
  useEffect(() => {
    if (expired) return;
    const interval = setInterval(checkPayment, 15000);
    return () => clearInterval(interval);
  }, [checkPayment, expired]);

  return (
    <div className="space-y-4">

      {/* Exact amount to send */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-3.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
            Step 1 — Send exactly this amount
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 p-5">
          <button
            type="button"
            onClick={() => copy(topup.expected_usdt.toString(), "amt")}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-violet-50 px-6 py-3.5 transition hover:bg-violet-100"
          >
            <span className="text-4xl font-black text-violet-700">{topup.expected_usdt}</span>
            <span className="text-xl font-bold text-violet-400">USDT</span>
            {copied === "amt"
              ? <CheckCircle className="h-5 w-5 text-emerald-500" />
              : <Copy className="h-5 w-5 text-violet-400" />}
          </button>
          <p className="text-xs font-bold text-red-500">
            ⚠ Send exact amount — off by even 0.0001 USDT will not be detected
          </p>
          <p className="text-xs text-gray-400">{topup.expected_usdt} USDT will be credited to your wallet</p>
        </div>
      </div>

      {/* QR + Address */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Step 2 — Scan QR or copy address
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR USDT"
            className="h-44 w-44 rounded-xl border border-gray-100 shadow-sm"
          />
          <button
            type="button"
            onClick={() => copy(topup.usdt_address, "addr")}
            className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition hover:bg-gray-100"
          >
            <span className="truncate font-mono text-sm text-gray-700">{topup.usdt_address}</span>
            {copied === "addr"
              ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              : <Copy className="h-4 w-4 shrink-0 text-gray-400" />}
          </button>
          <p className="text-xs text-amber-600 font-medium">
            ⚠ TRC20 network only · 仅支持TRC20网络
          </p>
        </div>
      </div>

      {/* Auto-confirm status bar */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <div>
            <p className="text-xs font-semibold text-gray-700">Auto-confirming...</p>
            <p className="text-[11px] text-gray-400">Nothing else needed · {m}:{s} remaining</p>
          </div>
        </div>
        <button
          type="button"
          onClick={checkPayment}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Check now"}
        </button>
      </div>

      {expired && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-700">
            Auto-confirm window expired.{" "}
            <button onClick={checkPayment} className="font-bold underline">Check again</button>
            {" "}or contact support if you already sent USDT.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TopupPage() {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [balance, setBalance]       = useState(0);
  const [requests, setRequests]     = useState<any[]>([]);
  const [selectedUsdt, setSelectedUsdt] = useState<number | null>(null);
  const [customUsdt, setCustomUsdt]     = useState("");
  const [creating, setCreating]         = useState(false);
  const [pending, setPending]           = useState<PendingTopup | null>(null);
  const [confirmed, setConfirmed]       = useState<number | null>(null);
  const [error, setError]               = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/topup");
    if (res.ok) { const d = await res.json(); setBalance(d.balance ?? 0); setRequests(d.requests ?? []); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const usdtAmount = selectedUsdt ?? (customUsdt ? parseFloat(customUsdt) || 0 : 0);

  async function createTopup() {
    if (usdtAmount < 1) { setError("Minimum topup is 1 USDT"); return; }
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usdt: usdtAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "no_address" ? "USDT address not configured by admin." : `Error: ${data.detail ?? data.error}`);
        setCreating(false);
        return;
      }
      setPending({ id: data.id, expected_usdt: data.expected_usdt, usdt_address: data.usdt_address });
      setPhase("pending");
    } catch {
      setError("Connection error. Please try again.");
    }
    setCreating(false);
  }

  function handleConfirmed(usdt: number) {
    setConfirmed(usdt);
    setPhase("confirmed");
    loadData();
  }

  // ── Confirmed screen ──
  if (phase === "confirmed" && confirmed !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Topup Successful!</h2>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-bold text-emerald-600">{confirmed} USDT</span>
              {" "}has been added to your wallet
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => { setPhase("idle"); setSelectedUsdt(null); setCustomUsdt(""); }}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Topup again
              </button>
              <Link href="/account"
                className="block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Back to wallet
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending screen ──
  if (phase === "pending" && pending) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#0a2218] to-[#0f1923]">
          <div className="relative mx-auto max-w-lg px-6 pb-8 pt-8">
            <button
              onClick={() => setPhase("idle")}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h1 className="text-xl font-bold text-white">Waiting for payment</h1>
            <p className="mt-1 text-sm text-slate-400">System confirms automatically once USDT is received — no further action needed</p>
          </div>
        </div>
        <div className="mx-auto max-w-lg px-6 py-6">
          <PendingPanel topup={pending} onConfirmed={handleConfirmed} />
        </div>
      </div>
    );
  }

  // ── Idle screen ──
  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#0a2218] to-[#0f1923]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="relative mx-auto max-w-lg px-6 pb-10 pt-8">
          <Link href="/account" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-300">
            <ArrowLeft className="h-3.5 w-3.5" /> My Wallet
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">USDT Wallet</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Topup</h1>
              <p className="mt-0.5 text-sm text-slate-500">Auto-confirmed · no transaction hash needed</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-600/90 to-teal-700/90 p-5 shadow-xl ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Current Balance</p>
                <p className="mt-1.5 text-3xl font-bold text-white">{balance} <span className="text-lg font-semibold text-emerald-200/80">USDT</span></p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <TrendingUp className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-6 py-7">

        {/* Amount selector */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3.5">
            <Zap className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">
              How much do you want to topup?
            </p>
          </div>
          <div className="space-y-4 p-5">

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.usdt}
                  type="button"
                  onClick={() => { setSelectedUsdt(p.usdt); setCustomUsdt(""); setError(""); }}
                  className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                    selectedUsdt === p.usdt
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Enter custom amount..."
                min="1"
                step="1"
                value={customUsdt}
                onChange={e => {
                  setCustomUsdt(e.target.value);
                  setSelectedUsdt(null);
                  setError("");
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-20 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">USDT</span>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}

            <button
              type="button"
              disabled={usdtAmount < 1 || creating}
              onClick={createTopup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create USDT Topup
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              After sending USDT · system auto-confirms in 1–3 minutes
            </p>
          </div>
        </div>

        {/* History */}
        {requests.filter(r => r.status !== "pending").length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Topup History</p>
            </div>
            <div className="divide-y divide-gray-50">
              {requests.filter(r => r.status !== "pending").slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      +{r.amount_usdt ?? "?"} USDT
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "rejected"  ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {r.status === "confirmed" ? <><CheckCircle className="h-3 w-3" /> Confirmed</> :
                     r.status === "rejected"  ? "✗ Rejected" :
                     <><Clock className="h-3 w-3" /> Pending</>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
