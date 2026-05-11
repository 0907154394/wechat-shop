"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, ShieldCheck, Zap, Package } from "lucide-react";

const MIGRATION_SQL = `-- Chạy lệnh này 1 lần để kích hoạt toàn bộ tính năng quản trị
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wallet';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_amount NUMERIC(18,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_tx_hash TEXT;

GRANT ALL ON TABLE products        TO service_role, authenticated;
GRANT ALL ON TABLE wechat_accounts TO service_role, authenticated;
GRANT ALL ON TABLE orders          TO service_role, authenticated;
GRANT ALL ON TABLE order_accounts  TO service_role, authenticated;
GRANT ALL ON TABLE settings        TO service_role, authenticated;

DROP POLICY IF EXISTS "Service role can insert products" ON products;
DROP POLICY IF EXISTS "Service role can update products" ON products;
DROP POLICY IF EXISTS "Service role can delete products" ON products;
CREATE POLICY "Service role can insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update products" ON products FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete products" ON products FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage wechat accounts" ON wechat_accounts;
CREATE POLICY "Service role can manage wechat accounts" ON wechat_accounts FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');`;

const SUPABASE_SQL_URL = "https://supabase.com/dashboard/project/snduvxjsvzqkfckdkqlk/sql/new";

export default function AdminSetupPage() {
  const [copied, setCopied] = useState(false);
  const [done, setDone]     = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Hệ thống đã sẵn sàng!</h2>
          <p className="mt-1 text-sm text-gray-400">Tất cả tính năng đã được kích hoạt.</p>
          <a href="/admin" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
            Về trang quản lý →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">

      {/* Title */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-200">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Kích hoạt hệ thống</h1>
        <p className="mt-1.5 text-sm text-gray-400">Cần thực hiện 1 lần duy nhất để mở khóa toàn bộ tính năng</p>
      </div>

      {/* What this unlocks */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Package,      label: "Tạo & quản lý\nsản phẩm" },
          { icon: Zap,          label: "Giao hàng\ntự động" },
          { icon: ShieldCheck,  label: "Thanh toán\nUSDT" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <Icon className="h-5 w-5 text-emerald-500" />
            <p className="whitespace-pre-line text-xs font-medium text-gray-600 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">

        {/* Steps */}
        <div className="divide-y divide-gray-50">

          {/* Step 1 */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white mt-0.5">1</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Sao chép lệnh kích hoạt</p>
              <p className="mt-1 text-xs text-gray-400">Nhấn nút bên dưới để sao chép toàn bộ lệnh vào clipboard</p>
              <button
                onClick={handleCopy}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {copied
                  ? <><CheckCircle2 className="h-4 w-4" /> Đã sao chép!</>
                  : <><Copy className="h-4 w-4" /> Sao chép lệnh kích hoạt</>
                }
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white mt-0.5">2</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Mở Supabase SQL Editor</p>
              <p className="mt-1 text-xs text-gray-400">Nhấn vào link dưới để mở trang chạy lệnh của Supabase</p>
              <a
                href={SUPABASE_SQL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Mở Supabase SQL Editor
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white mt-0.5">3</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Dán vào ô trống và nhấn Run</p>
              <p className="mt-1 text-xs text-gray-400">
                Trong Supabase, nhấn vào ô trắng lớn → dán lệnh vừa sao chép → nhấn nút <strong>Run</strong> (hoặc Ctrl+Enter)
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <img
                  src="https://i.imgur.com/placeholder.png"
                  alt=""
                  className="hidden"
                />
                <div className="px-4 py-3 text-center text-[11px] text-gray-400">
                  Nhấn ô trắng → Ctrl+V để dán → Ctrl+Enter để chạy
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Done button */}
        <div className="border-t border-gray-100 p-5">
          <button
            onClick={() => setDone(true)}
            className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 active:scale-[.98]"
          >
            ✓ Tôi đã chạy xong, kích hoạt hệ thống
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">Chỉ cần làm 1 lần. Không cần làm lại sau này.</p>
        </div>
      </div>

    </div>
  );
}
