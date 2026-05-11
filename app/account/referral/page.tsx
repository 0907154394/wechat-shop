"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Check, Gift, TrendingUp } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface Referral {
  id: string;
  reward_given: boolean;
  created_at: string;
}

export default function ReferralPage() {
  const [userId, setUserId] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [credits, setCredits] = useState(0);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    import("@/lib/supabase/client").then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        setUserId(data.user.id);

        sb.from("referrals").select("*").eq("referrer_id", data.user.id).order("created_at", { ascending: false })
          .then(({ data: rows }) => { if (rows) setReferrals(rows); });

        sb.from("user_credits").select("amount").eq("user_id", data.user.id).single()
          .then(({ data: row }) => { if (row) setCredits(row.amount); });
      });
    });
  }, []);

  const referralLink = `${origin}/?ref=${userId}`;
  const rewarded = referrals.filter(r => r.reward_given).length;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Giới thiệu bạn bè</h1>
            <p className="mt-1 text-sm text-slate-400">Nhận 50.000đ khi bạn bè mua hàng lần đầu</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-900/50">
            <Gift className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Đã giới thiệu", value: referrals.length, color: "bg-blue-50 text-blue-700" },
            { label: "Đã mua hàng",   value: rewarded,         color: "bg-emerald-50 text-emerald-700" },
            { label: "Credit hiện tại", value: formatVND(credits), color: "bg-amber-50 text-amber-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl ${color} px-5 py-4`}>
              <p className="text-xl font-black">{value}</p>
              <p className="mt-0.5 text-xs font-medium opacity-75">{label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Cách hoạt động
          </h2>
          <div className="space-y-3">
            {[
              { step: 1, text: "Chia sẻ link giới thiệu của bạn cho bạn bè" },
              { step: 2, text: "Bạn bè đăng ký và mua hàng lần đầu tiên" },
              { step: 3, text: "Bạn nhận ngay 50.000đ vào tài khoản" },
              { step: 4, text: "Credit được áp dụng tự động cho đơn hàng tiếp theo" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{step}</span>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral link */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Link giới thiệu của bạn</h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-xs text-gray-600 truncate">
              {userId ? referralLink : "Đang tải..."}
            </div>
            <button
              onClick={handleCopy}
              disabled={!userId}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Đã copy!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Referral history */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lịch sử giới thiệu</p>
          </div>
          {referrals.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Chưa có ai đăng ký qua link của bạn</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {referrals.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.reward_given ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.reward_given ? "+50.000đ" : "Chưa mua"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
