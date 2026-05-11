"use client";

import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import { formatVND } from "@/lib/utils";
import { ShoppingBag, Clock, PackageCheck } from "lucide-react";
import { OrdersClient } from "./OrdersClient";
import type { Order } from "@/lib/types";

interface Props {
  orders: Order[];
  displayName: string;
  stats: { total: number; pending: number; delivered: number; totalSpent: number };
}

export function OrdersPageContent({ orders, displayName, stats }: Props) {
  const { lang } = useLang();
  const T = tr(lang).ordersPage;

  const statCards = [
    { label: T.statTotal,     value: stats.total,     Icon: ShoppingBag,  bg: "bg-white/10 border-white/10",             iconCls: "text-white/70"    },
    { label: T.statPending,   value: stats.pending,   Icon: Clock,        bg: "bg-yellow-500/10 border-yellow-400/20",   iconCls: "text-yellow-400"  },
    { label: T.statDelivered, value: stats.delivered, Icon: PackageCheck, bg: "bg-emerald-500/10 border-emerald-400/20", iconCls: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 pb-16 pt-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <p className="mb-1 text-sm text-emerald-400 font-medium">
            {T.greeting.replace("{name}", displayName)}
          </p>
          <h1 className="text-3xl font-black text-white">{T.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{T.subtitle}</p>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
            {statCards.map(({ label, value, Icon, bg, iconCls }) => (
              <div key={label} className={`rounded-2xl border ${bg} backdrop-blur-sm px-3 py-3 sm:px-5 sm:py-4`}>
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${iconCls}`} strokeWidth={1.8} />
                  <span className="text-2xl font-black text-white">{value}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.totalSpent > 0 && (
        <div className="mx-auto max-w-4xl px-6">
          <div className="-mt-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-3.5 shadow-lg shadow-emerald-900/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-100">{T.totalSpent}</p>
              <p className="text-xl font-black text-white">{formatVND(stats.totalSpent)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-8">
        <OrdersClient orders={orders} />
      </div>
    </div>
  );
}
