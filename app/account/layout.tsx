"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Wallet, ShoppingBag, KeyRound,
  Shield, Users, LogOut, ChevronRight,
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { tr } from "@/lib/i18n";

// NAV is built inside the component to pick up translations

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const T = tr(lang).accountPage;

  const nav = [
    { href: "/account",          icon: LayoutDashboard, label: T.linkDashboard },
    { href: "/account/topup",    icon: Wallet,          label: T.linkTopup },
    { href: "/orders",           icon: ShoppingBag,     label: T.linkOrders },
    { href: "/account/password", icon: KeyRound,        label: T.linkPassword },
    { href: "/account/security", icon: Shield,          label: T.linkSecurity },
    { href: "/account/referral", icon: Users,           label: T.linkReferral },
  ];

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setUsername(user.user_metadata?.username ?? "");
      setFullName(user.user_metadata?.full_name ?? "");
    }
    async function loadBalance() {
      const res = await fetch("/api/topup");
      if (res.ok) { const d = await res.json(); setBalance(d.balance ?? 0); }
    }
    load();
    loadBalance();
  }, []);

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = fullName
    ? fullName.trim().split(" ").slice(-2).map((w: string) => w[0]).join("").toUpperCase()
    : username ? username.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">

          {/* ── Sidebar ── */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-6 space-y-3">

              {/* Profile + balance */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-sm">
                    <span className="text-sm font-black text-white">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{fullName || username || "—"}</p>
                    {username && <p className="truncate font-mono text-xs text-gray-400">@{username}</p>}
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100/70">{T.balanceLabel}</p>
                  <p className="mt-0.5 text-xl font-black text-white">{balance} <span className="text-sm font-semibold text-emerald-200/80">USDT</span></p>
                </div>
              </div>

              {/* Nav links */}
              <nav className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {nav.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || (href !== "/account" && href !== "/orders" && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } border-b border-gray-50 last:border-0`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                      {label}
                      {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-400" />}
                    </Link>
                  );
                })}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {T.signOut}
                </button>
              </nav>

            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="min-w-0 flex-1">

            {/* Mobile: horizontal tab strip */}
            <div className="mb-4 overflow-x-auto lg:hidden">
              <div className="flex w-max gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
                {nav.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || (href !== "/account" && href !== "/orders" && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                        active ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
