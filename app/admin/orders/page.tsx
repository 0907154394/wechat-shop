export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  pending: { label: "Chờ TT", variant: "warning" as const },
  paid: { label: "Đã TT", variant: "info" as const },
  delivered: { label: "Đã giao", variant: "success" as const },
  cancelled: { label: "Huỷ", variant: "danger" as const },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tất cả đơn hàng</h1>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-gray-500 font-medium">Mã đơn</th>
                <th className="pb-3 text-left text-gray-500 font-medium">Sản phẩm</th>
                <th className="pb-3 text-left text-gray-500 font-medium">Tiền</th>
                <th className="pb-3 text-left text-gray-500 font-medium">Trạng thái</th>
                <th className="pb-3 text-left text-gray-500 font-medium">Ngày tạo</th>
                <th className="pb-3 text-left text-gray-500 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order: any) => {
                const s = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="py-3 font-mono font-bold">{order.order_code}</td>
                    <td className="py-3">{order.products?.name}</td>
                    <td className="py-3 font-medium text-green-600">{formatVND(order.amount)}</td>
                    <td className="py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                    <td className="py-3 text-gray-500">{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
