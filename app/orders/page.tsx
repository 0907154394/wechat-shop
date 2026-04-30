export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Chờ thanh toán", variant: "warning" as const },
  paid: { label: "Đã thanh toán", variant: "info" as const },
  delivered: { label: "Đã giao hàng", variant: "success" as const },
  cancelled: { label: "Đã huỷ", variant: "danger" as const },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>

      {!orders || orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">Bạn chưa có đơn hàng nào.</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-green-600 hover:underline">
            Mua ngay →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const s = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.products?.name}</p>
                      <p className="text-sm text-gray-500">
                        #{order.order_code} · {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-600">{formatVND(order.amount)}</span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
