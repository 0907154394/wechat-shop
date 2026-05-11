export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { revalidatePath } from "next/cache";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  delivered: "Đã giao hàng",
  cancelled: "Đã huỷ",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: orderAccounts } = await supabase
    .from("order_accounts")
    .select("*, wechat_accounts(*)")
    .eq("order_id", id);

  const { data: userRow } = await supabase.auth.admin.getUserById(order.user_id);
  const userEmail = userRow?.user?.email ?? order.user_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-emerald-600">← Quay lại</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Đơn #{order.order_code}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString("vi-VN")}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLOR[order.status] ?? STATUS_COLOR.pending}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Order info */}
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm">
            <h2 className="font-semibold text-gray-900 text-base">Thông tin đơn hàng</h2>
            {[
              { label: "Khách hàng", value: userEmail },
              { label: "Sản phẩm", value: order.products?.name },
              { label: "Số lượng", value: order.quantity },
              { label: "Tổng tiền", value: <span className="font-bold text-emerald-600">{formatVND(order.amount)}</span> },
              { label: "Nội dung CK", value: <span className="font-mono">{order.order_code}</span> },
              ...(order.paid_at ? [{ label: "Thanh toán lúc", value: new Date(order.paid_at).toLocaleString("vi-VN") }] : []),
              ...(order.payment_note ? [{ label: "Ghi chú CK", value: order.payment_note }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="text-right font-medium text-gray-900">{value as any}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivered accounts */}
        {orderAccounts && orderAccounts.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold text-gray-900 text-base">Tài khoản đã giao</h2>
              <div className="space-y-3">
                {orderAccounts.map((oa: any, i: number) => (
                  <div key={oa.id} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm">
                    <p className="font-semibold text-emerald-800 mb-2">Tài khoản #{i + 1}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-gray-900 text-base">Thao tác</h2>
            <div className="flex flex-wrap gap-3">
              {order.status === "pending" && (
                <form action={markPaidAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Đánh dấu Đã thanh toán
                  </button>
                </form>
              )}
              {order.status === "paid" && (
                <form action={markDeliveredAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Giao hàng thủ công
                  </button>
                </form>
              )}
              {(order.status === "pending" || order.status === "paid") && (
                <form action={cancelOrderAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Huỷ đơn
                  </button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function markPaidAction(formData: FormData) {
  "use server";
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  const id = formData.get("id") as string;
  await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}

async function markDeliveredAction(formData: FormData) {
  "use server";
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  const id = formData.get("id") as string;
  await supabase.from("orders").update({ status: "delivered" }).eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}

async function cancelOrderAction(formData: FormData) {
  "use server";
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  const id = formData.get("id") as string;
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}
