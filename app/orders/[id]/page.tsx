export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatVND } from "@/lib/utils";
import { Clock, CheckCircle, Truck, XCircle, ChevronLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";

const steps = [
  { key: "pending",   label: "Chờ thanh toán", icon: Clock },
  { key: "paid",      label: "Đã thanh toán",  icon: CheckCircle },
  { key: "delivered", label: "Đã giao hàng",   icon: Truck },
];
const statusOrder = ["pending", "paid", "delivered"];

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

  const currentStep = statusOrder.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-emerald-400">
            <ChevronLeft className="h-4 w-4" /> Đơn hàng của tôi
          </Link>
          <h1 className="text-3xl font-black text-white">Đơn #{order.order_code}</h1>
          <p className="mt-1 text-sm text-slate-400">{new Date(order.created_at).toLocaleString("vi-VN")}</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-8">

        <div className="space-y-5">
          {/* Status timeline */}
          {!isCancelled ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng thái đơn hàng</p>
              <div className="relative flex items-start justify-between">
                {/* Progress bar */}
                <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: currentStep === 0 ? "0%" : currentStep === 1 ? "50%" : "100%" }}
                  />
                </div>
                {steps.map(({ key, label, icon: Icon }, i) => {
                  const done = currentStep >= i;
                  return (
                    <div key={key} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        done ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 bg-white text-gray-300"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className={`text-xs font-medium text-center ${done ? "text-emerald-600" : "text-gray-400"}`}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Đơn hàng đã bị huỷ</p>
                <p className="text-sm text-red-600">Liên hệ hỗ trợ nếu bạn đã thanh toán.</p>
              </div>
            </div>
          )}

          {/* Pay now */}
          {order.status === "pending" && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <div>
                <p className="font-semibold text-yellow-800">Chưa thanh toán</p>
                <p className="mt-0.5 text-sm text-yellow-600">Hoàn tất để nhận tài khoản WeChat</p>
              </div>
              <Link href={`/orders/${id}/pay`}>
                <Button className="shrink-0">Thanh toán ngay</Button>
              </Link>
            </div>
          )}

          {/* Order details */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Chi tiết đơn hàng</p>
            </div>
            <div className="divide-y divide-gray-50 text-sm">
              {[
                { label: "Sản phẩm",   value: (order as any).products?.name },
                { label: "Số lượng",   value: `${order.quantity} tài khoản` },
                { label: "Mã đơn",     value: order.order_code, mono: true },
                ...(order.paid_at ? [{ label: "Thanh toán lúc", value: new Date(order.paid_at).toLocaleString("vi-VN") }] : []),
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-medium text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="font-semibold text-gray-700">Tổng tiền</span>
                <span className="text-lg font-black text-emerald-600">{formatVND(order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivered accounts */}
          {orderAccounts && orderAccounts.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-sm">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">Tài khoản WeChat của bạn</p>
                  <p className="text-xs text-emerald-600">{orderAccounts.length} tài khoản · Lưu lại thông tin này</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {orderAccounts.map((oa: any, i: number) => (
                  <div key={oa.id} className="p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Tài khoản #{i + 1}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { label: "Username",      value: oa.wechat_accounts?.username },
                        { label: "Password",      value: oa.wechat_accounts?.password },
                        ...(oa.wechat_accounts?.phone_number ? [{ label: "Số điện thoại", value: oa.wechat_accounts.phone_number }] : []),
                        ...(oa.wechat_accounts?.backup_email ? [{ label: "Email backup",  value: oa.wechat_accounts.backup_email }]  : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-mono text-sm font-bold text-gray-900">{value}</p>
                            <CopyButton value={value} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
