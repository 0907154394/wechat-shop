"use client";

import { useState } from "react";
import { Wallet, Bitcoin, AlertCircle } from "lucide-react";
import { WalletPayButton } from "./WalletPayButton";
import { UsdtPayPanel } from "./UsdtPayPanel";
import { formatVND } from "@/lib/utils";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import Link from "next/link";

interface Props {
  orderId: string;
  orderCode: string;
  amount: number;
  balance: number;
  usdtAddress: string;
  initialMethod: "wallet" | "usdt_direct";
  initialUsdtAmount: number;
}

export function PayMethodSwitcher({
  orderId, orderCode, amount, balance, usdtAddress, initialMethod, initialUsdtAmount,
}: Props) {
  const { lang } = useLang();
  const T = tr(lang).pay;
  const [method, setMethod] = useState<"wallet" | "usdt_direct">(initialMethod);
  const [usdtAmount, setUsdtAmount] = useState(initialUsdtAmount);

  function switchTo(next: "wallet" | "usdt_direct") {
    if (next === method) return;
    // Switch tab immediately (optimistic), persist in background
    setMethod(next);
    fetch(`/api/orders/${orderId}/switch-method`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: next }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && next === "usdt_direct" && data.usdtAmount) {
          setUsdtAmount(data.usdtAmount);
        }
      })
      .catch(() => {});
  }

  const sufficient = balance >= amount;

  return (
    <div className="space-y-4">
      {/* Method tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => switchTo("wallet")}
          disabled={false}
          className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all disabled:opacity-60 ${
            method === "wallet"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Wallet className={`h-4 w-4 shrink-0 ${method === "wallet" ? "text-emerald-600" : "text-gray-400"}`} />
          <div className="text-left">
            <p className={`text-sm font-semibold leading-none ${method === "wallet" ? "text-emerald-700" : "text-gray-600"}`}>
              {T.walletTab}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">{formatVND(balance)}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => switchTo("usdt_direct")}
          disabled={false}
          className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all disabled:opacity-60 ${
            method === "usdt_direct"
              ? "border-violet-500 bg-violet-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Bitcoin className={`h-4 w-4 shrink-0 ${method === "usdt_direct" ? "text-violet-600" : "text-gray-400"}`} />
          <div className="text-left">
            <p className={`text-sm font-semibold leading-none ${method === "usdt_direct" ? "text-violet-700" : "text-gray-600"}`}>
              USDT
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">{T.usdtTab}</p>
          </div>
        </button>
      </div>

      {/* Panel */}
      {method === "usdt_direct" ? (
        <UsdtPayPanel
          orderId={orderId}
          orderCode={orderCode}
          usdtAmount={usdtAmount}
          usdtAddress={usdtAddress}
          amountVnd={amount}
        />
      ) : (
        <>
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${sufficient ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sufficient ? "bg-emerald-500" : "bg-red-400"}`}>
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">{T.balanceLabel}</p>
                  <p className={`text-xl font-bold ${sufficient ? "text-emerald-700" : "text-red-600"}`}>{formatVND(balance)}</p>
                </div>
              </div>
              {!sufficient && (
                <div className="text-right">
                  <p className="text-xs text-red-500 font-medium">{T.shortage}</p>
                  <p className="text-sm font-bold text-red-600">{formatVND(amount - balance)}</p>
                </div>
              )}
            </div>
          </div>

          {!sufficient && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">{T.insufficientTitle}</p>
                <p className="mt-0.5 text-xs text-amber-600">
                  {T.insufficientDesc.replace("{amount}", formatVND(amount - balance))}
                </p>
                <Link href="/account/topup"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                  <Wallet className="h-3 w-3" /> {T.topupNow}
                </Link>
              </div>
            </div>
          )}

          <WalletPayButton orderId={orderId} sufficient={sufficient} amount={amount} />
        </>
      )}
    </div>
  );
}
