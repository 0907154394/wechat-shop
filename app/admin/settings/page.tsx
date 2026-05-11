export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { Headphones, Wallet } from "lucide-react";

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

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Shop</h1>
        <p className="mt-1 text-sm text-gray-400">Quản lý thông tin thanh toán, ví USDT và kênh hỗ trợ</p>
      </div>

      <form action={saveSettingsAction} className="space-y-5">

        {/* ── 1. Nạp ví USDT ── */}
        <Section icon={Wallet} color="bg-violet-500" title="Nạp ví USDT" desc="Khách nạp tiền vào ví bằng USDT TRC20 · Binance API tự động xác nhận">
          <Field label="Địa chỉ ví USDT TRC20 (Binance)" hint="Lấy từ Binance → Ví → Nạp tiền → USDT → TRC20">
            <input name="usdt_address" defaultValue={settings.usdt_address} placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Tỷ giá 1 USDT = ? VND" hint="Cập nhật thường xuyên theo tỷ giá thực tế">
            <div className="relative">
              <input name="usdt_rate" type="number" defaultValue={settings.usdt_rate} placeholder="25500" className={`${inputCls} w-full pr-14`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">VND</span>
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Binance API Key" hint="Lấy từ Binance → API Management → tạo key với quyền Enable Reading">
              <input name="binance_api_key" defaultValue={settings.binance_api_key} placeholder="Dán API Key vào đây"
                className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Binance API Secret" hint="Chỉ hiện 1 lần khi tạo — lưu ngay">
              <input name="binance_api_secret" defaultValue={settings.binance_api_secret}
                placeholder={settings.binance_api_secret ? "••••••••••••••••" : "Dán Secret Key vào đây"}
                className={`${inputCls} font-mono`} />
            </Field>
          </div>
          {settings.binance_api_key ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Binance API đã cấu hình — hệ thống tự xác minh TX Hash
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Chưa có Binance API Key — khách nhập TX Hash sẽ không tự xác minh được
            </div>
          )}
        </Section>

        {/* ── 3. Liên hệ hỗ trợ ── */}
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
    { key: "usdt_address",      value: formData.get("usdt_address") as string },
    { key: "usdt_rate",         value: formData.get("usdt_rate") as string },
    { key: "binance_api_key",    value: formData.get("binance_api_key") as string },
    { key: "binance_api_secret", value: formData.get("binance_api_secret") as string },
    { key: "wechat_id",    value: formData.get("wechat_id") as string },
    { key: "telegram",     value: (formData.get("telegram") as string).replace("@", "") },
    { key: "zalo",         value: formData.get("zalo") as string },
    { key: "facebook_page", value: formData.get("facebook_page") as string },
  ];

  for (const { key, value } of updates) {
    await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/orders");
}
