export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ExportButton } from "./ExportButton";

const statusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-500",
};
const statusLabel: Record<string, string> = {
  pending: "Chờ TT", paid: "Đã TT", delivered: "Đã giao", cancelled: "Huỷ",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false })
    .limit(500);

  const total = orders?.length ?? 0;
  const totalRevenue = orders?.filter(o => o.status === "delivered").reduce((s, o) => s + o.amount, 0) ?? 0;
  const pending = orders?.filter(o => o.status === "pending").length ?? 0;
  const delivered = orders?.filter(o => o.status === "delivered").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
          <p className="mt-1 text-sm text-gray-500">{total} đơn hàng</p>
        </div>
        <ExportButton orders={orders ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn", value: total, color: "bg-gray-50 text-gray-700" },
          { label: "Chờ thanh toán", value: pending, color: "bg-yellow-50 text-yellow-700" },
          { label: "Đã giao", value: delivered, color: "bg-emerald-50 text-emerald-700" },
          { label: "Doanh thu", value: formatVND(totalRevenue), color: "bg-blue-50 text-blue-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl ${color} px-5 py-4`}>
            <p className="text-xl font-black">{value}</p>
            <p className="text-sm font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Mã đơn", "Sản phẩm", "Số tiền", "Trạng thái", "Ngày tạo", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>Chưa có đơn hàng nào</p>
                </td>
              </tr>
            )}
            {orders?.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-mono font-bold text-gray-800">{order.order_code}</td>
                <td className="px-5 py-3.5 text-gray-600">{order.products?.name}</td>
                <td className="px-5 py-3.5 font-semibold text-emerald-600">{formatVND(order.amount)}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/admin/orders/${order.id}`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
