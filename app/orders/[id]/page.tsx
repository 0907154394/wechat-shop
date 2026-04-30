export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  pending: { label: "Chờ thanh toán", variant: "warning" as const },
  paid: { label: "Đã thanh toán", variant: "info" as const },
  delivered: { label: "Đã giao hàng", variant: "success" as const },
  cancelled: { label: "Đã huỷ", variant: "danger" as const },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const { data: orderAccounts } = await supabase
    .from("order_accounts")
    .select("*, wechat_accounts(*)")
    .eq("order_id", id);

  const s = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn hàng #{order.order_code}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleString("vi-VN")}
          </p>
        </div>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900">Chi tiết đơn hàng</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Sản phẩm</span>
              <span className="font-medium">{(order as any).products?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số lượng</span>
              <span className="font-medium">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền</span>
              <span className="font-bold text-green-600">{formatVND(order.amount)}</span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Thanh toán lúc</span>
                <span>{new Date(order.paid_at).toLocaleString("vi-VN")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {order.status === "pending" && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-yellow-700 mb-3">Đơn hàng chưa được thanh toán</p>
              <Link href={`/orders/${id}/pay`}>
                <Button size="sm">Tiến hành thanh toán</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {orderAccounts && orderAccounts.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-gray-900">Tài khoản WeChat của bạn</h3>
              <div className="space-y-3">
                {orderAccounts.map((oa: any, i: number) => (
                  <div key={oa.id} className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm">
                    <p className="font-medium text-green-800 mb-2">Tài khoản #{i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="font-mono font-bold">{oa.wechat_accounts?.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Password</p>
                        <p className="font-mono font-bold">{oa.wechat_accounts?.password}</p>
                      </div>
                      {oa.wechat_accounts?.phone_number && (
                        <div>
                          <p className="text-xs text-gray-500">Số điện thoại</p>
                          <p className="font-mono">{oa.wechat_accounts.phone_number}</p>
                        </div>
                      )}
                      {oa.wechat_accounts?.backup_email && (
                        <div>
                          <p className="text-xs text-gray-500">Email backup</p>
                          <p className="font-mono">{oa.wechat_accounts.backup_email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link href="/orders" className="text-sm text-green-600 hover:underline">
            ← Xem tất cả đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
