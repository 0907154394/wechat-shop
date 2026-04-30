export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

const BANKS = [
  { id: "MB", name: "MB Bank" },
  { id: "VCB", name: "Vietcombank" },
  { id: "TCB", name: "Techcombank" },
  { id: "ACB", name: "ACB" },
  { id: "BIDV", name: "BIDV" },
  { id: "VPB", name: "VPBank" },
  { id: "TPB", name: "TPBank" },
  { id: "MSB", name: "MSB" },
  { id: "OCB", name: "OCB" },
  { id: "SHB", name: "SHB" },
  { id: "VIB", name: "VIB" },
];

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Cài đặt Shop</h1>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-1 font-semibold text-gray-900">Thông tin ngân hàng nhận tiền</h2>
          <p className="mb-5 text-sm text-gray-500">
            Khách sẽ chuyển khoản vào tài khoản này. Thay đổi ở đây sẽ cập nhật QR ngay lập tức.
          </p>

          <form action={saveSettingsAction} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ngân hàng</label>
              <select
                name="bank_id"
                defaultValue={settings.bank_id}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              >
                {BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Số tài khoản</label>
              <input
                name="account_no"
                defaultValue={settings.account_no}
                required
                placeholder="VD: 0123456789"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tên chủ tài khoản</label>
              <input
                name="account_name"
                defaultValue={settings.account_name}
                required
                placeholder="VD: NGUYEN VAN A (viết IN HOA)"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400">Viết IN HOA, đúng tên trên tài khoản ngân hàng</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tên shop</label>
              <input
                name="shop_name"
                defaultValue={settings.shop_name}
                required
                placeholder="WeChat Shop VN"
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Sau khi lưu cần làm thêm:</p>
              <ul className="space-y-1 text-blue-600">
                <li>• Đảm bảo đã liên kết đúng TK này trên Casso Flow</li>
                <li>• Casso sẽ theo dõi biến động và gửi webhook về web khi có tiền vào</li>
              </ul>
            </div>

            <Button type="submit" size="lg">Lưu cài đặt</Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview QR */}
      {settings.account_no && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold text-gray-900">Preview QR thanh toán</h3>
            <div className="flex items-center gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.vietqr.io/image/${settings.bank_id}-${settings.account_no}-compact2.png?accountName=${encodeURIComponent(settings.account_name)}`}
                alt="VietQR Preview"
                className="h-40 w-40 rounded-lg border object-cover"
              />
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Ngân hàng:</span> <strong>{BANKS.find(b => b.id === settings.bank_id)?.name}</strong></p>
                <p><span className="text-gray-500">Số TK:</span> <strong className="font-mono">{settings.account_no}</strong></p>
                <p><span className="text-gray-500">Chủ TK:</span> <strong>{settings.account_name}</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function saveSettingsAction(formData: FormData) {
  "use server";

  const supabase = await createAdminClient();

  const updates = [
    { key: "bank_id", value: formData.get("bank_id") as string },
    { key: "account_no", value: formData.get("account_no") as string },
    { key: "account_name", value: (formData.get("account_name") as string).toUpperCase() },
    { key: "shop_name", value: formData.get("shop_name") as string },
  ];

  for (const { key, value } of updates) {
    await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/orders");
}
