"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

interface Props {
  orderId: string;
  orderCode: string;
  usdtAmount: number;
  usdtAddress: string;
  amountVnd?: number;
}

function useCountdown(minutes: number) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return { h, m, s, expired: seconds <= 0 };
}

export function UsdtPayPanel({ orderId, orderCode, usdtAmount, usdtAddress, amountVnd }: Props) {
  const router = useRouter();
  const { lang } = useLang();
  const T = tr(lang).pay;
  const { h, m, s, expired } = useCountdown(20);
  const [copied, setCopied] = useState<"addr" | "amt" | null>(null);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"waiting" | "confirmed" | "failed">("waiting");

  // USDT TRC20 URI: address only in QR (maximally compatible across wallets)
  // Amount shown separately — wallet apps fill address, user enters exact amount
  const qrData = encodeURIComponent(usdtAddress || "configure-usdt-address-in-admin-settings");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${qrData}`;

  function copy(text: string, type: "addr" | "amt") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const checkPayment = useCallback(async () => {
    if (status === "confirmed") return;
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/check-usdt`, { method: "POST" });
      const data = await res.json();
      if (data.paid) {
        setStatus("confirmed");
        setTimeout(() => router.push(`/orders/${orderId}`), 1500);
      }
    } catch {}
    setChecking(false);
  }, [orderId, status, router]);

  // Auto-poll every 15 seconds
  useEffect(() => {
    if (expired || status === "confirmed") return;
    const interval = setInterval(checkPayment, 15000);
    return () => clearInterval(interval);
  }, [checkPayment, expired, status]);

  if (status === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-bold text-emerald-700">{T.confirmedTitle}</p>
        <p className="text-sm text-emerald-600">{T.confirmedDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">{T.usdtTitle}</p>
        <p className="mt-1 text-xs text-violet-400">{T.orderCode}: {orderCode}</p>
      </div>

      {/* Amount + QR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        {/* Amount */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">{T.amountLabel}</p>
          <button
            type="button"
            onClick={() => copy(usdtAmount.toString(), "amt")}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-5 py-2.5 transition hover:bg-violet-100"
          >
            <span className="text-3xl font-black text-violet-700">{usdtAmount}</span>
            <span className="text-base font-bold text-violet-400">USDT</span>
            {copied === "amt"
              ? <CheckCircle className="h-4 w-4 text-emerald-500" />
              : <Copy className="h-4 w-4 text-violet-400" />}
          </button>
          <p className="mt-1 text-[11px] text-red-500 font-medium">
            {T.amountWarning}
          </p>
        </div>

        {/* QR */}
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR USDT"
            className="h-48 w-48 rounded-xl border border-gray-100 shadow-sm"
          />
        </div>

        {/* Address */}
        <div>
          <p className="text-xs text-gray-400 mb-1">{T.addressLabel}</p>
          <button
            type="button"
            onClick={() => copy(usdtAddress, "addr")}
            className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left transition hover:bg-gray-100"
          >
            <span className="truncate font-mono text-sm text-gray-700">{usdtAddress}</span>
            {copied === "addr"
              ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              : <Copy className="h-4 w-4 shrink-0 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Countdown + status */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{T.expiresIn}</span>
          <span className={`font-mono text-sm font-bold ${expired ? "text-red-500" : "text-gray-700"}`}>
            {h}:{m}:{s}
          </span>
        </div>
        <button
          type="button"
          onClick={checkPayment}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? T.checking : T.checkNow}
        </button>
      </div>

      {expired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {T.expired}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {T.autoConfirm}
      </p>
    </div>
  );
}
