export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND, buildVietQRUrl } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import Image from "next/image";
import type { Order } from "@/lib/types";
import { PaymentStatusPoller } from "./payment-poller";

export default async function PayOrderPage({ params }: { params: Promise<{ id: string }> }) {
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

  if ((order as Order).status === "delivered") {
    redirect(`/orders/${id}`);
  }

  const settings = await getSettings();
  const qrUrl = buildVietQRUrl({
    bankId: settings.bank_id,
    accountNo: settings.account_no,
    accountName: settings.account_name,
    amount: order.amount,
    addInfo: order.order_code,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Thanh toán đơn hàng</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* QR Code */}
        <Card>
          <CardContent className="flex flex-col items-center pt-6 gap-4">
            <p className="text-sm font-medium text-gray-600">Quét QR để chuyển khoản</p>
            <div className="relative h-56 w-56 rounded-lg overflow-hidden border">
              <Image
                src={qrUrl}
                alt="VietQR Payment"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="w-full rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
              <p className="font-medium text-yellow-800 mb-1">Nội dung chuyển khoản bắt buộc:</p>
              <p className="font-mono text-lg font-bold text-yellow-900 tracking-wider text-center">
                {order.order_code}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sản phẩm</span>
                  <span className="font-medium">{(order as any).products?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số lượng</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-bold text-green-600">{formatVND(order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn</span>
                  <span className="font-mono font-bold">{order.order_code}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Lưu ý quan trọng</p>
              <ul className="space-y-1">
                <li>• Chuyển khoản <strong>đúng số tiền</strong> {formatVND(order.amount)}</li>
                <li>• Nội dung CK phải có <strong>{order.order_code}</strong></li>
                <li>• Hệ thống xác nhận trong vòng 1-2 phút</li>
                <li>• Đơn hàng hết hạn sau 30 phút nếu chưa CK</li>
              </ul>
            </CardContent>
          </Card>

          <PaymentStatusPoller orderId={id} />
        </div>
      </div>
    </div>
  );
}
