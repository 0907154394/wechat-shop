export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import {
  Banknote, TrendingUp, ShoppingBag, Clock, Archive,
  AlertTriangle, Zap, PackageCheck, Plus, Upload, Settings,
  ArrowUpRight, Activity,
} from "lucide-react";
import { RevenueChart } from "./RevenueChart";

export default async function AdminDashboard() {
  const supabase = await createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: deliveredOrders },
    { data: revenueData },
    { data: todayRevenueData },
    { data: recentOrders },
    { data: paidOrders },
    { count: totalAccounts },
    { count: availableAccounts },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("orders").select("amount").eq("status", "delivered"),
    supabase.from("orders").select("amount").eq("status", "delivered").gte("paid_at", today.toISOString()),
    supabase.from("orders").select("*, products(name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("orders").select("*, products(name)").eq("status", "paid").order("paid_at", { ascending: false }),
    supabase.from("wechat_accounts").select("*", { count: "exact", head: true }),
    supabase.from("wechat_accounts").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("products").select("id, name, stock").eq("is_active", true).lt("stock", 5),
  ]);

  const totalRevenue = revenueData?.reduce((s: number, o: { amount: number }) => s + o.amount, 0) ?? 0;
  const todayRevenue = todayRevenueData?.reduce((s: number, o: { amount: number }) => s + o.amount, 0) ?? 0;
  const isLowStock = (availableAccounts ?? 0) < 10;
  const hasPaidOrders = (paidOrders?.length ?? 0) > 0;

  const { data: chartOrders } = await supabase
    .from("orders").select("amount, paid_at").eq("status", "delivered")
    .gte("paid_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("paid_at", { ascending: true });

  function buildChartData(days: number) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      const dayOrders = chartOrders?.filter((o: { paid_at: string | null; amount: number }) => o.paid_at?.slice(0, 10) === key) ?? [];
      return {
        label: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: dayOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0),
        orders: dayOrders.length,
      };
    });
  }

  const weekData = buildChartData(7);
  const monthData = buildChartData(30);

  const statusLabel: Record<string, string> = { pending: "Chờ TT", paid: "Đã TT", delivered: "Đã giao", cancelled: "Huỷ" };
  const statusStyle: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700",
    paid:      "bg-blue-100 text-blue-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const dateStr = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top header bar */}
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-400 capitalize">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Hệ thống hoạt động
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">

        {/* Primary KPI row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Total revenue - large */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 p-6 shadow-lg shadow-emerald-200">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative">
              <div className="mb-1 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-100" />
                <p className="text-sm font-medium text-emerald-100">Tổng doanh thu</p>
              </div>
              <p className="text-4xl font-black text-white tracking-tight">{formatVND(totalRevenue)}</p>
              <p className="mt-2 text-xs text-emerald-200">{deliveredOrders ?? 0} đơn đã giao thành công</p>
            </div>
          </div>

          {/* Today revenue */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-6 shadow-lg shadow-blue-200">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="relative">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-100" />
                <p className="text-sm font-medium text-blue-100">Doanh thu hôm nay</p>
              </div>
              <p className="text-4xl font-black text-white tracking-tight">{formatVND(todayRevenue)}</p>
              <p className="mt-2 text-xs text-blue-200">
                {todayRevenue > 0 ? "Có giao dịch hôm nay" : "Chưa có giao dịch hôm nay"}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Tổng đơn",
              value: totalOrders ?? 0,
              icon: ShoppingBag,
              from: "#7c3aed", to: "#a855f7",
              shadow: "rgba(124,58,237,0.35)",
            },
            {
              label: "Chờ thanh toán",
              value: pendingOrders ?? 0,
              icon: Clock,
              from: "#d97706", to: "#f59e0b",
              shadow: "rgba(217,119,6,0.35)",
            },
            {
              label: "Đã giao",
              value: deliveredOrders ?? 0,
              icon: PackageCheck,
              from: "#0d9488", to: "#14b8a6",
              shadow: "rgba(13,148,136,0.35)",
            },
            {
              label: "Kho acc",
              value: `${availableAccounts ?? 0}/${totalAccounts ?? 0}`,
              icon: Archive,
              from: isLowStock ? "#dc2626" : "#2563eb",
              to:   isLowStock ? "#ef4444" : "#3b82f6",
              shadow: isLowStock ? "rgba(220,38,38,0.35)" : "rgba(37,99,235,0.35)",
            },
          ].map(({ label, value, icon: Icon, from, to, shadow }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              {/* subtle gradient bg tint */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />
              {/* icon with gradient bg */}
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${from}, ${to})`,
                  boxShadow: `0 4px 12px ${shadow}`,
                }}
              >
                <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
              </div>
              {/* value */}
              <p
                className="text-3xl font-black leading-none tracking-tight"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                {value}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Chart + Alerts grid */}
        <div className="grid grid-cols-3 gap-5">
          {/* Chart - 2/3 width */}
          <div className="col-span-2">
            <RevenueChart weekData={weekData} monthData={monthData} />
          </div>

          {/* Right panel - 1/3 width */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Thao tác nhanh</p>
              <div className="space-y-2">
                {[
                  { label: "Thêm sản phẩm", href: "/admin/products", icon: Plus,         color: "bg-emerald-500" },
                  { label: "Nhập kho acc",   href: "/admin/accounts", icon: Upload,       color: "bg-blue-500"    },
                  { label: "Xem đơn hàng",   href: "/admin/orders",   icon: ShoppingBag,  color: "bg-violet-500"  },
                  { label: "Cài đặt shop",   href: "/admin/settings", icon: Settings,     color: "bg-slate-600"   },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="flex-1">{label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* System status */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Trạng thái hệ thống
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Webhook thanh toán", ok: true  },
                  { label: "Giao hàng tự động",  ok: true  },
                  { label: "Kho acc",             ok: !isLowStock },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">{label}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                      {ok ? "OK" : "Cảnh báo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(hasPaidOrders || (lowStockProducts?.length ?? 0) > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {hasPaidOrders && (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-md shadow-orange-200">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-orange-900">{paidOrders!.length} đơn cần giao ngay</h3>
                    <p className="text-xs text-orange-600">Khách đã thanh toán, chưa nhận hàng</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {paidOrders!.slice(0, 3).map((order: any) => (
                    <Link key={order.id} href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs transition-all hover:shadow-sm border border-orange-100">
                      <span className="font-mono font-bold text-gray-800">{order.order_code}</span>
                      <span className="text-gray-500 truncate max-w-[100px]">{order.products?.name}</span>
                      <span className="font-semibold text-emerald-600">{formatVND(order.amount)}</span>
                    </Link>
                  ))}
                </div>
                {paidOrders!.length > 3 && (
                  <Link href="/admin/orders" className="mt-3 block text-center text-xs font-semibold text-orange-700 hover:underline">
                    Xem tất cả {paidOrders!.length} đơn →
                  </Link>
                )}
              </div>
            )}

            {(lowStockProducts?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 shadow-md shadow-red-200">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-900">Kho sắp hết hàng</h3>
                    <p className="text-xs text-red-600">Cần nhập thêm acc sớm</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {lowStockProducts!.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs border border-red-100">
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <span className={`font-bold ${p.stock === 0 ? "text-red-600" : "text-orange-500"}`}>
                        {p.stock === 0 ? "Hết hàng" : `Còn ${p.stock} acc`}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/admin/accounts" className="mt-3 block text-center text-xs font-semibold text-red-700 hover:underline">
                  Nhập kho ngay →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Recent orders */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Xem tất cả <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {["Mã đơn", "Sản phẩm", "Số tiền", "Trạng thái", "Ngày tạo"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!recentOrders?.length ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">Chưa có đơn hàng nào.</td></tr>
                ) : recentOrders.map((order: any) => (
                  <tr key={order.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 font-mono text-sm font-bold text-gray-800">{order.order_code}</td>
                    <td className="px-6 py-3.5 text-gray-600">{order.products?.name}</td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-600">{formatVND(order.amount)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
