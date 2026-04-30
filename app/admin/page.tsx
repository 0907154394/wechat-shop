export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: deliveredOrders },
    { data: recentOrders },
    { count: totalAccounts },
    { count: availableAccounts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("orders").select("*, products(name)").order("created_at", { ascending: false }).limit(10),
    supabase.from("wechat_accounts").select("*", { count: "exact", head: true }),
    supabase.from("wechat_accounts").select("*", { count: "exact", head: true }).eq("status", "available"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng đơn hàng", value: totalOrders ?? 0 },
          { label: "Chờ thanh toán", value: pendingOrders ?? 0, color: "text-yellow-600" },
          { label: "Đã giao", value: deliveredOrders ?? 0, color: "text-green-600" },
          { label: "Acc còn lại", value: `${availableAccounts ?? 0}/${totalAccounts ?? 0}`, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color || "text-gray-900"}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <Link href="/admin/products" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          + Thêm sản phẩm
        </Link>
        <Link href="/admin/accounts" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Nhập kho acc WeChat
        </Link>
        <Link href="/admin/orders" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Xem tất cả đơn
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold text-gray-900">Đơn hàng gần đây</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-gray-500 font-medium">Mã đơn</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Sản phẩm</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Tiền</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Trạng thái</th>
                  <th className="pb-3 text-left text-gray-500 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="py-3 font-mono font-bold">{order.order_code}</td>
                    <td className="py-3">{order.products?.name}</td>
                    <td className="py-3 text-green-600 font-medium">{formatVND(order.amount)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "delivered" ? "bg-green-100 text-green-800" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
