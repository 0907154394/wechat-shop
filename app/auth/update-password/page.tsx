"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShieldCheck } from "lucide-react";

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-gray-400"}`}>
      <span className="font-bold">{ok ? "✓" : "○"}</span>
      {label}
    </div>
  );
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const confirmOk = password === confirm;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    if (!rules.length || !rules.uppercase || !rules.special)
      return setError("Mật khẩu chưa đáp ứng yêu cầu.");
    if (!confirmOk) return setError("Mật khẩu xác nhận không khớp.");
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Có lỗi xảy ra. Vui lòng thử lại hoặc yêu cầu link mới.");
      setLoading(false);
    } else {
      setSuccess("Mật khẩu đã được cập nhật! Đang chuyển hướng...");
      setTimeout(() => router.push("/"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm p-6 shadow-xl shadow-emerald-100/50">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-200">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-black tracking-tight text-gray-900">
                WeChat <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">Shop</span>
              </span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">Vietnam</span>
            </div>
          </div>

          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
            <p className="mt-1 text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password" required
                  autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                {password && (
                  <div className="mt-1 space-y-1 rounded-lg bg-gray-50 p-2">
                    <Rule ok={rules.length} label="Ít nhất 8 ký tự" />
                    <Rule ok={rules.uppercase} label="Ít nhất 1 chữ hoa (A-Z)" />
                    <Rule ok={rules.special} label="Ít nhất 1 ký tự đặc biệt (@#$...)" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input
                  type="password" required
                  autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  className={`h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 ${
                    confirm && !confirmOk
                      ? "border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-100"
                  }`}
                />
                {confirm && !confirmOk && (
                  <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>Cập nhật mật khẩu</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
