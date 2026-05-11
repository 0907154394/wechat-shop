"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-gray-400"}`}>
      <span className="font-bold">{ok ? "✓" : "○"}</span>
      {label}
    </div>
  );
}

export default function ChangePasswordPage() {
  const { lang } = useLang();
  const T = tr(lang).passwordPage;

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const rules = {
    length:    newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
  };
  const confirmOk = newPassword === confirm;

  async function handleChange(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    if (!rules.length || !rules.uppercase || !rules.special)
      return setError(T.errRules);
    if (!confirmOk) return setError(T.mismatch);
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setSuccess(T.successMsg); setNewPassword(""); setConfirm(""); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <Link href="/account" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-emerald-400">
              <ChevronLeft className="h-4 w-4" /> {T.back}
            </Link>
            <h1 className="text-3xl font-black text-white">{T.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{T.subtitle}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-400 shadow-lg shadow-blue-900/50">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{T.section}</p>
          </div>
          <div className="p-6">
            {error   && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <form onSubmit={handleChange} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{T.newLabel}</label>
                <input
                  type="password" required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                {newPassword && (
                  <div className="mt-1 space-y-1 rounded-lg bg-gray-50 p-2.5">
                    <Rule ok={rules.length}    label={T.ruleLength} />
                    <Rule ok={rules.uppercase} label={T.ruleUpper} />
                    <Rule ok={rules.special}   label={T.ruleSpecial} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{T.confirmLabel}</label>
                <input
                  type="password" required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={`h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 ${
                    confirm && !confirmOk
                      ? "border-red-300 focus:ring-red-100"
                      : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-100"
                  }`}
                />
                {confirm && !confirmOk && (
                  <p className="text-xs text-red-500">{T.mismatch}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={loading}>{T.submitBtn}</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
