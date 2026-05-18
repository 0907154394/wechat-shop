export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { Headphones, Wallet, CheckCircle, ShieldAlert } from "lucide-react";

function Section({ icon: Icon, color, title, desc, children }: {
  icon: React.ElementType; color: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const settings = await getSettings();
  const { saved } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Shop</h1>
        <p className="mt-1 text-sm text-gray-400">Quản lý thông tin thanh toán, ví USDT và kênh hỗ trợ</p>
      </div>

      {saved === "1" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          Đã lưu cài đặt thành công!
        </div>
      )}

      <form action={saveSettingsAction} className="space-y-5">

        {/* ── 1. Nạp ví USDT ── */}
        <Section icon={Wallet} color="bg-violet-500" title="USDT Wallet Topup" desc="Customers deposit via USDT TRC20 · Tronscan auto-confirms">
          <Field label="USDT TRC20 Address" hint="From your exchange: Deposit → USDT → TRC20 network">
            <input name="usdt_address" defaultValue={settings.usdt_address} placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`${inputCls} font-mono`} />
          </Field>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Auto-confirmation via Tronscan · TRONSCAN_API_KEY in environment variables
          </div>
        </Section>

        {/* ── 3. Chống spam mua hàng ── */}
        <Section icon={ShieldAlert} color="bg-red-500" title="Chống spam mua hàng" desc="Giới hạn số lượng đặt hàng để tránh lạm dụng">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Đơn pending tối đa" hint="Số đơn chưa thanh toán cùng lúc">
              <input name="max_pending_orders" type="number" min="1" defaultValue={settings.max_pending_orders} placeholder="3" className={inputCls} />
            </Field>
            <Field label="SL tối đa mỗi đơn" hint="Số tài khoản tối đa trong 1 đơn hàng">
              <input name="max_quantity_per_order" type="number" min="1" defaultValue={settings.max_quantity_per_order} placeholder="10" className={inputCls} />
            </Field>
            <Field label="Đơn tối đa mỗi ngày" hint="Giới hạn tổng số đơn đặt trong 1 ngày">
              <input name="max_orders_per_day" type="number" min="1" defaultValue={settings.max_orders_per_day} placeholder="20" className={inputCls} />
            </Field>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            💡 Đặt giá trị cao (999) để gần như tắt giới hạn.
          </div>
        </Section>

        {/* ── 4. Liên hệ hỗ trợ ── */}
        <Section icon={Headphones} color="bg-blue-500" title="Liên hệ hỗ trợ" desc="Hiển thị trong FloatSupport và Footer cho khách hàng">
          <div className="grid grid-cols-2 gap-4">
            <Field label="WeChat ID (客服微信号)" hint="Khách Trung tìm kiếm WeChat này để chat">
              <input name="wechat_id" defaultValue={settings.wechat_id} placeholder="wechatshopvn" className={inputCls} />
            </Field>
            <Field label="Telegram" hint="Username, không cần @">
              <input name="telegram" defaultValue={settings.telegram} placeholder="wechatshopvn" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số Zalo">
              <input name="zalo" defaultValue={settings.zalo} placeholder="0901234567" className={inputCls} />
            </Field>
            <Field label="Link Facebook Page">
              <input name="facebook_page" defaultValue={settings.facebook_page} placeholder="https://facebook.com/..." className={inputCls} />
            </Field>
          </div>
        </Section>

        <Button type="submit" size="lg" className="w-full">Lưu tất cả cài đặt</Button>
      </form>
    </div>
  );
}

async function saveSettingsAction(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const updates = [
    { key: "usdt_address", value: formData.get("usdt_address") as string },
    { key: "wechat_id",    value: formData.get("wechat_id") as string },
    { key: "telegram",     value: (formData.get("telegram") as string).replace("@", "") },
    { key: "zalo",         value: formData.get("zalo") as string },
    { key: "facebook_page", value: formData.get("facebook_page") as string },
    { key: "max_pending_orders",        value: formData.get("max_pending_orders") as string || "3" },
    { key: "max_quantity_per_order",     value: formData.get("max_quantity_per_order") as string || "10" },
    { key: "max_orders_per_day",         value: formData.get("max_orders_per_day") as string || "20" },
  ];

  for (const { key, value } of updates) {
    await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/orders");

  const { redirect } = await import("next/navigation");
  redirect("/admin/settings?saved=1");
}
