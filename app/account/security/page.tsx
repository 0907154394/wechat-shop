"use client";

import { useEffect, useState } from "react";
import { Shield, Monitor, Smartphone, Clock } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

interface LoginEvent {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function SecurityPage() {
  const { lang } = useLang();
  const T = tr(lang).securityPage;

  const [history, setHistory] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);

  function parseDevice(ua: string | null): { label: string; icon: typeof Monitor } {
    if (!ua) return { label: T.unknownDevice, icon: Monitor };
    const lower = ua.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/.test(lower);
    const browser = lower.includes("chrome") ? "Chrome"
      : lower.includes("firefox") ? "Firefox"
      : lower.includes("safari") ? "Safari"
      : lower.includes("edge") ? "Edge"
      : "Browser";
    const os = lower.includes("windows") ? "Windows"
      : lower.includes("mac") ? "macOS"
      : lower.includes("android") ? "Android"
      : lower.includes("iphone") || lower.includes("ipad") ? "iOS"
      : lower.includes("linux") ? "Linux"
      : "Unknown OS";
    return { label: `${browser} ${T.on} ${os}`, icon: isMobile ? Smartphone : Monitor };
  }

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        sb.from("login_history")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data: rows }) => {
            if (rows) setHistory(rows);
            setLoading(false);
          });
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 px-6 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">{T.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{T.subtitle}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-400 shadow-lg shadow-rose-900/50">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-5">
        {/* Security tips */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-800 mb-2">{T.tipsTitle}</p>
          <ul className="space-y-1.5 text-xs text-blue-700">
            {T.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
          </ul>
        </div>

        {/* Login history */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{T.historyTitle}</p>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">{T.empty}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((event, i) => {
                const { label, icon: DevIcon } = parseDevice(event.user_agent);
                return (
                  <div key={event.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      <DevIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        IP: {event.ip_address ?? T.unknownIp} ·{" "}
                        {new Date(event.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {T.current}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
