"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Copy, CheckCircle, Clock, ArrowLeft, RefreshCw, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

const PRESETS = [
  { vnd: 250000,  label: "250k" },
  { vnd: 500000,  label: "500k" },
  { vnd: 1000000, label: "1M" },
  { vnd: 2500000, label: "2.5M" },
];

type Phase = "idle" | "pending" | "confirmed";

interface PendingTopup {
  id: string;
  expected_usdt: number;
  amount_vnd: number;
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
  onConfirmed: (vnd: number, usdt: number) => void;
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
      if (data.confirmed) onConfirmed(data.amount_vnd, data.amount_usdt);
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
            Bước 1 — Gửi chính xác số USDT này
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
            ⚠ Gửi đúng số tiền trên — sai dù 0.0001 USDT cũng không xác nhận được
          </p>
          <p className="text-xs text-gray-400">{formatVND(topup.amount_vnd)} sẽ được cộng vào ví</p>
        </div>
      </div>

      {/* QR + Address */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Bước 2 — Quét QR hoặc sao chép địa chỉ
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
            ⚠ Chỉ gửi qua mạng <strong>TRC20</strong> · 仅支持TRC20网络
          </p>
        </div>
      </div>

      {/* Auto-confirm status bar */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <div>
            <p className="text-xs font-semibold text-gray-700">Đang tự động xác nhận...</p>
            <p className="text-[11px] text-gray-400">Không cần làm gì thêm · còn {m}:{s}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={checkPayment}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Đang kiểm tra..." : "Kiểm tra ngay"}
        </button>
      </div>

      {expired && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-700">
            Hết thời gian tự động.{" "}
            <button onClick={checkPayment} className="font-bold underline">Kiểm tra lại</button>
            {" "}hoặc liên hệ hỗ trợ nếu đã gửi USDT.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TopupPage() {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [balance, setBalance]       = useState(0);
  const [usdtRate, setUsdtRate]     = useState(25500);
  const [requests, setRequests]     = useState<any[]>([]);
  const [selectedVnd, setSelectedVnd] = useState<number | null>(null);
  const [customVnd, setCustomVnd]   = useState("");
  const [creating, setCreating]     = useState(false);
  const [pending, setPending]       = useState<PendingTopup | null>(null);
  const [confirmed, setConfirmed]   = useState<{ vnd: number; usdt: number } | null>(null);
  const [error, setError]           = useState("");

  const loadData = useCallback(async () => {
    const [dataRes, settingsRes] = await Promise.all([
      fetch("/api/topup"),
      fetch("/api/settings"),
    ]);
    if (dataRes.ok)     { const d = await dataRes.json(); setBalance(d.balance ?? 0); setRequests(d.requests ?? []); }
    if (settingsRes.ok) { const s = await settingsRes.json(); setUsdtRate(parseFloat(s.usdt_rate) || 25500); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const vndAmount = selectedVnd ?? (customVnd ? parseInt(customVnd.replace(/\D/g, "")) || 0 : 0);
  const approxUsdt = vndAmount > 0 ? (vndAmount / usdtRate).toFixed(4) : "0";

  async function createTopup() {
    if (vndAmount < 50000) { setError("Số tiền tối thiểu là 50,000đ"); return; }
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_vnd: vndAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === "no_address"
          ? "Admin chưa cài địa chỉ ví USDT."
          : `Lỗi: ${data.error ?? "unknown"}${data.detail ? ` — ${data.detail}` : ""}`;
        setError(msg);
        setCreating(false);
        return;
      }
      setPending({ id: data.id, expected_usdt: data.expected_usdt, amount_vnd: data.amount_vnd, usdt_address: data.usdt_address });
      setPhase("pending");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setCreating(false);
  }

  function handleConfirmed(vnd: number, usdt: number) {
    setConfirmed({ vnd, usdt });
    setPhase("confirmed");
    loadData();
  }

  // ── Confirmed screen ──
  if (phase === "confirmed" && confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nạp tiền thành công!</h2>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-bold text-emerald-600">{formatVND(confirmed.vnd)}</span>
              {" "}đã được cộng vào ví của bạn
            </p>
            <p className="mt-1 text-xs text-gray-400">({confirmed.usdt} USDT)</p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => { setPhase("idle"); setSelectedVnd(null); setCustomVnd(""); }}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Nạp tiếp
              </button>
              <Link href="/account"
                className="block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Về trang ví
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
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
            </button>
            <h1 className="text-xl font-bold text-white">Chờ xác nhận thanh toán</h1>
            <p className="mt-1 text-sm text-slate-400">Hệ thống tự xác nhận sau khi nhận được USDT — không cần nhập thêm gì</p>
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
            <ArrowLeft className="h-3.5 w-3.5" /> Ví của tôi
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">Ví USDT</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Nạp tiền</h1>
              <p className="mt-0.5 text-sm text-slate-500">Tự động xác nhận · không cần nhập mã giao dịch</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-600/90 to-teal-700/90 p-5 shadow-xl ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Số dư hiện tại</p>
                <p className="mt-1.5 text-3xl font-bold text-white">{formatVND(balance)}</p>
                <p className="mt-0.5 text-xs text-emerald-200/60">1 USDT = {formatVND(usdtRate)}</p>
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
              Bạn muốn nạp bao nhiêu?
            </p>
          </div>
          <div className="space-y-4 p-5">

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.vnd}
                  type="button"
                  onClick={() => { setSelectedVnd(p.vnd); setCustomVnd(""); setError(""); }}
                  className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                    selectedVnd === p.vnd
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
                type="text"
                inputMode="numeric"
                placeholder="Nhập số tiền khác..."
                value={customVnd ? parseInt(customVnd).toLocaleString("vi-VN") : ""}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setCustomVnd(raw);
                  setSelectedVnd(null);
                  setError("");
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-14 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VND</span>
            </div>

            {vndAmount >= 50000 && (
              <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
                <span className="text-sm text-gray-500">Bạn cần gửi:</span>
                <span className="text-sm font-bold text-violet-700">≈ {approxUsdt} USDT</span>
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}

            <button
              type="button"
              disabled={vndAmount < 50000 || creating}
              onClick={createTopup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang tạo lệnh...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Tạo lệnh nạp USDT
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Sau khi gửi USDT · hệ thống tự xác nhận trong 1–3 phút
            </p>
          </div>
        </div>

        {/* History */}
        {requests.filter(r => r.status !== "pending").length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Lịch sử nạp tiền</p>
            </div>
            <div className="divide-y divide-gray-50">
              {requests.filter(r => r.status !== "pending").slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.amount_usdt != null ? `+${r.amount_usdt} USDT` : "Chuyển khoản"} → {formatVND(r.amount_vnd)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{new Date(r.created_at).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "rejected"  ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {r.status === "confirmed" ? <><CheckCircle className="h-3 w-3" /> Đã nạp</> :
                     r.status === "rejected"  ? "✗ Từ chối" :
                     <><Clock className="h-3 w-3" /> Chờ</>}
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
