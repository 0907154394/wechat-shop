"use client";

import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import { formatVND } from "@/lib/utils";
import { ChevronLeft, ShoppingBag, Zap } from "lucide-react";
import Link from "next/link";
import { PayMethodSwitcher } from "./PayMethodSwitcher";

interface Props {
  orderId: string;
  orderCode: string;
  productName: string;
  quantity: number;
  amount: number;
  balance: number;
  usdtAddress: string;
  initialMethod: "wallet" | "usdt_direct";
  initialUsdtAmount: number;
}

export function PayContent({
  orderId, orderCode, productName, quantity, amount,
  balance, usdtAddress, initialMethod, initialUsdtAmount,
}: Props) {
  const { lang } = useLang();
  const T = tr(lang).pay;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-lg">
          <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
            <ChevronLeft className="h-4 w-4" /> {T.backOrders}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{T.confirmPayment}</h1>
          <p className="mt-0.5 text-sm text-gray-400">#{orderCode}</p>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3.5">
            <ShoppingBag className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{T.orderDetails}</p>
          </div>
          <div className="space-y-3 p-5 text-sm">
            {[
              { label: T.product,  value: productName },
              { label: T.quantity, value: `${quantity} ${T.accounts}` },
              { label: T.orderCode, value: orderCode },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="font-semibold text-gray-700">{T.total}</span>
              <span className="text-xl font-bold text-emerald-600">{formatVND(amount)}</span>
            </div>
          </div>
        </div>

        <PayMethodSwitcher
          orderId={orderId}
          orderCode={orderCode}
          amount={amount}
          balance={balance}
          usdtAddress={usdtAddress}
          initialMethod={initialMethod}
          initialUsdtAmount={initialUsdtAmount}
        />

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Zap className="h-3.5 w-3.5 text-emerald-500" />
          {T.deliveryNote}
        </div>
      </div>
    </div>
  );
}
