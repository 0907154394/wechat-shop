"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, RotateCcw, ArrowRight, Package, Clock, CheckCircle, XCircle, ChevronRight, LayoutList, Hourglass, BadgeCheck, Ban, Trash2 } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";
import type { Order } from "@/lib/types";

const STATUS_CONFIG = {
  pending:   { bg: "bg-yellow-100",  text: "text-yellow-700",  icon: Clock,        dot: "bg-yellow-400"  },
  paid:      { bg: "bg-blue-100",    text: "text-blue-700",    icon: CheckCircle,  dot: "bg-blue-400"    },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle,  dot: "bg-emerald-400" },
  cancelled: { bg: "bg-gray-100",    text: "text-gray-500",    icon: XCircle,      dot: "bg-gray-400"    },
} as const;

const FILTER_KEYS = [
  { key: "all",       icon: LayoutList },
  { key: "pending",   icon: Hourglass  },
  { key: "delivered", icon: BadgeCheck },
  { key: "cancelled", icon: Ban        },
] as const;

export function OrdersClient({ orders }: { orders: Order[]; stats?: unknown }) {
  const router = useRouter();
  const { lang } = useLang();
  const T = tr(lang).ordersPage;
  const [filter, setFilter] = useState<"all"|"pending"|"delivered"|"cancelled">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search || o.order_code.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [orders, filter, search]);

  const filterLabels: Record<string, string> = {
    all: T.filterAll, pending: T.filterPending, delivered: T.filterDelivered, cancelled: T.filterCancelled,
  };

  if (orders.length === 0) return <EmptyState T={T} />;

  return (
    <div className="space-y-4">
      {/* Filter + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_KEYS.map(tab => {
            const count = tab.key === "all" ? orders.length
              : orders.filter(o => o.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  filter === tab.key
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {filterLabels[tab.key]}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={T.searchPlaceholder}
            className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:w-52"
          />
        </div>
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm font-medium text-gray-400">{T.noOrders}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => <OrderCard key={order.id} order={order} T={T} onCancelled={() => router.refresh()} />)}
        </div>
      )}
    </div>
  );
}

type TOrders = ReturnType<typeof tr>["ordersPage"];

function OrderCard({ order, T, onCancelled }: { order: Order; T: TOrders; onCancelled: () => void }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const currentStatus = cancelled ? "cancelled" : order.status;
  const cs = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const CurrentIcon = cs.icon;

  const statusLabel: Record<string, string> = {
    pending: T.statusPending, paid: T.statusPaid, delivered: T.statusDelivered, cancelled: T.statusCancelled,
  };

  async function handleCancel() {
    if (!confirm(T.cancelConfirm)) return;
    setCancelling(true);
    await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
    setCancelled(true);
    setCancelling(false);
    onCancelled();
  }

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cs.bg}`}>
          <CurrentIcon className={`h-5 w-5 ${cs.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-bold text-gray-800">{order.order_code}</p>
              <p className="mt-0.5 text-sm text-gray-500 truncate">{order.products?.name ?? "—"}</p>
            </div>
            <p className="shrink-0 text-lg font-black text-emerald-600">{formatVND(order.amount)}</p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cs.bg} ${cs.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`} />
                {statusLabel[currentStatus] ?? currentStatus}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {currentStatus === "pending" && (
                <>
                  <Link
                    href={`/orders/${order.id}/pay`}
                    className="flex items-center gap-1 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-yellow-600"
                  >
                    {T.pay}
                  </Link>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    {T.cancel}
                  </button>
                </>
              )}
              {(currentStatus === "delivered" || currentStatus === "cancelled") && order.product_id && (
                <Link
                  href={`/products/${order.product_id}`}
                  className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <RotateCcw className="h-3 w-3" />
                  {T.rebuy}
                </Link>
              )}
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center gap-0.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 group-hover:bg-emerald-50 group-hover:text-emerald-700"
              >
                {T.detail}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ T }: { T: TOrders }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-200">
        <Package className="h-9 w-9 text-white" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-gray-800">{T.emptyTitle}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-gray-400 leading-relaxed">{T.emptyDesc}</p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:scale-105 hover:shadow-xl"
      >
        {T.viewProducts}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
